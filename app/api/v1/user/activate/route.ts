
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

            if (activationCode.type === 'annual') {
                if (!user) {
                    user = await tx.user.create({
                        data: {
                            deviceId,
                            password: 'device-login',
                            name: `Device User ${deviceId.substring(0, 6)}`,
                            points: 1000,
                            role: 'user',
                        },
                    });
                    // 新用户，直接设置到期时间 + 赠积分已在 create 中设置
                    const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                    user = await tx.user.update({
                        where: { id: user.id },
                        data: { subscriptionExpiresAt: newExpiry },
                    });
                    await tx.pointTransaction.create({
                        data: {
                            userId: user.id,
                            amount: 1000,
                            type: 'recharge',
                            description: '年卡激活赠送积分',
                            relatedId: activationCode.id,
                        },
                    });
                } else {
                    const now = new Date();
                    const base = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
                        ? user.subscriptionExpiresAt
                        : now;
                    const newExpiry = new Date(base.getTime() + 365 * 24 * 60 * 60 * 1000);
                    const isFirstActivation = !user.subscriptionExpiresAt;

                    user = await tx.user.update({
                        where: { id: user.id },
                        data: {
                            subscriptionExpiresAt: newExpiry,
                            ...(isFirstActivation ? { points: { increment: 1000 } } : {}),
                        },
                    });

                    if (isFirstActivation) {
                        await tx.pointTransaction.create({
                            data: {
                                userId: user.id,
                                amount: 1000,
                                type: 'recharge',
                                description: '年卡激活赠送积分',
                                relatedId: activationCode.id,
                            },
                        });
                    }
                }
            } else if (activationCode.type === 'recharge') {
                if (!user) {
                    throw new Error('User not found for this device. Please use an annual code first.');
                }
                user = await tx.user.update({
                    where: { id: user.id },
                    data: { points: { increment: activationCode.points } },
                });
            } else {
                throw new Error('Unsupported activation code type: ' + activationCode.type);
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
                        type: 'recharge',
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
