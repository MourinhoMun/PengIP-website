
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

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

        if (activationCode.status === 'expired') {
            return NextResponse.json({ error: 'Activation code has expired' }, { status: 400 });
        }

        if (activationCode.status === 'used') {
            return NextResponse.json({ error: 'Activation code has reached maximum uses' }, { status: 400 });
        }

        // 3. 检查设备是否已经用过这个码
        const usedDevices: string[] = activationCode.usedDevices
            ? JSON.parse(activationCode.usedDevices)
            : [];

        if (usedDevices.includes(deviceId)) {
            // 同一设备重复激活：不扣次数，直接返回 token
            let user = await prisma.user.findUnique({ where: { deviceId } });
            if (!user) {
                return NextResponse.json({ error: 'Device user not found' }, { status: 404 });
            }
            const token = sign(
                { userId: user.id, deviceId: user.deviceId, role: user.role },
                JWT_SECRET,
                { expiresIn: '365d' }
            );
            return NextResponse.json({
                success: true,
                token,
                user: { userId: user.id, balance: user.points },
                message: '该设备已激活过此码，已重新登录',
            });
        }

        // 4. 检查是否还有剩余次数
        if (activationCode.usedCount >= activationCode.maxUses) {
            return NextResponse.json({ error: 'Activation code has reached maximum uses' }, { status: 400 });
        }

        // 5. 事务处理
        let user: any;

        await prisma.$transaction(async (tx) => {
            user = await tx.user.findUnique({ where: { deviceId } });

            if (activationCode.type === 'license') {
                if (!user) {
                    user = await tx.user.create({
                        data: {
                            deviceId,
                            password: 'device-login',
                            name: `Device User ${deviceId.substring(0, 6)}`,
                            points: activationCode.points,
                            role: 'user',
                        },
                    });
                } else {
                    user = await tx.user.update({
                        where: { id: user.id },
                        data: { points: { increment: activationCode.points } },
                    });
                }
            } else if (activationCode.type === 'recharge') {
                if (!user) {
                    throw new Error('User not found for this device. Please activate a license first.');
                }
                user = await tx.user.update({
                    where: { id: user.id },
                    data: { points: { increment: activationCode.points } },
                });
            }

            // 6. 更新激活码：增加使用次数，记录设备
            const newUsedDevices = [...usedDevices, deviceId];
            const newUsedCount = activationCode.usedCount + 1;
            const newStatus = newUsedCount >= activationCode.maxUses ? 'used' : 'active';

            await tx.activationCode.update({
                where: { id: activationCode.id },
                data: {
                    usedCount: newUsedCount,
                    usedDevices: JSON.stringify(newUsedDevices),
                    status: newStatus,
                    userId: user?.id,
                    deviceId: deviceId,
                    usedAt: new Date(),
                },
            });

            // 7. 记录交易流水
            if (user) {
                await tx.pointTransaction.create({
                    data: {
                        userId: user.id,
                        amount: activationCode.points,
                        type: activationCode.type === 'license' ? 'register' : 'recharge',
                        description: `Code: ${activationCode.code} (device ${newUsedCount}/${activationCode.maxUses})`,
                        relatedId: activationCode.id,
                    },
                });
            }
        });

        // 8. 生成 Token
        if (!user) {
            return NextResponse.json({ error: 'Failed to process user' }, { status: 500 });
        }

        const token = sign(
            { userId: user.id, deviceId: user.deviceId, role: user.role },
            JWT_SECRET,
            { expiresIn: '365d' }
        );

        return NextResponse.json({
            success: true,
            token,
            user: {
                userId: user.id,
                balance: user.points,
            },
        });

    } catch (error: any) {
        console.error('Activate error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
