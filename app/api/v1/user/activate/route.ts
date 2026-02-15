
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { sign } from 'jsonwebtoken';

// 简单的 JWT 签名密钥，实际生产应放在环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, deviceId } = body;

        // 1. 参数校验
        if (!code || !deviceId) {
            return NextResponse.json({ error: 'Code and deviceId are required' }, { status: 400 });
        }

        // 2. 查找激活码
        const activationCode = await prisma.activationCode.findUnique({
            where: { code: code.trim().toUpperCase() },
        });

        if (!activationCode) {
            return NextResponse.json({ error: 'Invalid activation code' }, { status: 404 });
        }

        if (activationCode.status !== 'unused') {
            return NextResponse.json({ error: 'Activation code already used or expired' }, { status: 400 });
        }

        // 3. 处理不同类型的激活码
        let user;

        await prisma.$transaction(async (tx) => {
            // 查找或创建用户 (基于 deviceId)
            user = await tx.user.findUnique({
                where: { deviceId },
            });

            if (activationCode.type === 'license') {
                // License: 注册新用户/绑定设备并赠送初始积分
                if (!user) {
                    // 如果没有用户，创建一个
                    user = await tx.user.create({
                        data: {
                            deviceId,
                            password: 'device-login', // Placeholder
                            name: `Device User ${deviceId.substring(0, 6)}`,
                            points: activationCode.points,
                            role: 'user',
                        },
                    });
                } else {
                    // 如果用户已存在，可以选择报错或者叠加积分？
                    // 规范说: "创建新用户 UserWallet, set balance = x"
                    // 为了友好，如果已存在，我们视为充值或重置？
                    // 假设 license 是建立账户，如果已存在，我们增加积分
                    await tx.user.update({
                        where: { id: user.id },
                        data: { points: { increment: activationCode.points } }
                    });
                }
            } else if (activationCode.type === 'recharge') {
                // Recharge: 仅充值
                if (!user) {
                    throw new Error('User not found for this device. Please activate a license first.');
                }
                await tx.user.update({
                    where: { id: user.id },
                    data: { points: { increment: activationCode.points } },
                });
            } else {
                // tool_activation or other types -> Not supported in this API likely
                // Handle legacy tool activation if needed, or error
                // For now, assume this API is strictly for the Client Software flow
            }

            // 4. 更新激活码状态
            await tx.activationCode.update({
                where: { id: activationCode.id },
                data: {
                    status: 'used',
                    userId: user?.id,
                    deviceId: deviceId,
                    usedAt: new Date(),
                },
            });

            // 5. 记录交易流水
            if (user) {
                await tx.pointTransaction.create({
                    data: {
                        userId: user.id,
                        amount: activationCode.points,
                        type: activationCode.type === 'license' ? 'register' : 'recharge',
                        description: `Code: ${activationCode.code}`,
                        relatedId: activationCode.id
                    }
                })
            }
        });

        // 6. 生成 Token
        if (!user) {
            return NextResponse.json({ error: 'Failed to process user' }, { status: 500 });
        }

        // 生成长期 Token
        const token = sign(
            { userId: (user as any).id, deviceId: (user as any).deviceId, role: (user as any).role },
            JWT_SECRET,
            { expiresIn: '365d' } // 1 year token for client
        );

        return NextResponse.json({
            success: true,
            token,
            user: {
                userId: (user as any).id,
                balance: (user as any).points, // Transaction updated this logic already
            },
        });

    } catch (error: any) {
        console.error('Activate error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
