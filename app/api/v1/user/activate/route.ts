
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { sign } from 'jsonwebtoken';
import { fail, mapError } from '@/app/lib/apiError';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
}

// Tell TS that JWT_SECRET is definitely a string after the runtime check.
const JWT_SECRET_VALUE: string = JWT_SECRET;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, deviceId } = body;

        // 1. 参数校验
        if (!code || !deviceId) {
            return fail(400, {
                code: 'MISSING_PARAMETER',
                error: '你这次激活信息没填完整，所以激活不了。',
                reason: '缺少 code（激活码）或 deviceId（设备标识）。',
                next: '请回到激活页面重新输入激活码后再试；如果是小程序/子应用调用，请刷新页面重试。',
            });
        }

        // 2. 查找激活码
        const activationCode = await prisma.activationCode.findUnique({
            where: { code: code.trim().toUpperCase() },
        });

        if (!activationCode) {
            return fail(404, {
                code: 'ACTIVATION_CODE_NOT_FOUND',
                error: '这个激活码我们没查到，可能输错了或者已经失效了。',
                reason: '系统找不到对应的激活码记录。',
                next: '请检查大小写和字符（建议直接复制粘贴）；如果是购买的激活码，请确认是否已过期或被停用。',
            });
        }

        if (activationCode.status === 'expired') {
            return fail(400, {
                code: 'ACTIVATION_CODE_EXPIRED',
                error: '这个激活码已经过期了，用不了了。',
                reason: '激活码状态是“已过期”。',
                next: '请联系鹏哥获取新的激活码，或更换有效的激活码再试。',
            });
        }

        if (activationCode.status === 'suspended') {
            return fail(400, {
                code: 'ACTIVATION_CODE_SUSPENDED',
                error: '这个激活码被暂停使用了，暂时激活不了。',
                reason: '激活码状态是“已暂停”。',
                next: '请联系鹏哥处理（可能需要恢复该码的状态），或换一个可用的激活码。',
            });
        }

        if (activationCode.status === 'used') {
            // 年卡一码多设备：达到 maxUses 后，仅允许已绑定过的设备重新登录
            if (activationCode.type === 'annual' && activationCode.userId) {
                const usedDevices: string[] = activationCode.usedDevices
                    ? JSON.parse(activationCode.usedDevices)
                    : [];

                if (usedDevices.includes(deviceId)) {
                    const existingUser = await prisma.user.findUnique({ where: { id: activationCode.userId } });
                    if (existingUser) {
                        const token = sign(
                            { userId: existingUser.id, deviceId: existingUser.deviceId, role: existingUser.role },
                            JWT_SECRET_VALUE,
                            { expiresIn: '365d' }
                        );
                        await prisma.user.update({ where: { id: existingUser.id }, data: { currentToken: token } });
                        return NextResponse.json({
                            success: true,
                            token,
                            user: { userId: existingUser.id, balance: existingUser.points },
                            message: '已重新登录',
                        });
                    }
                }
            }
            return fail(400, {
                code: 'ACTIVATION_CODE_MAX_USES',
                error: '这个激活码已经被用满了，暂时不能再激活。',
                reason: '该激活码的可用次数已达到上限。',
                next: '请换一个新的激活码；如果你觉得不应该用满，请把激活码和设备信息发给我们核对。',
            });
        }

        // 3. 检查设备是否已经用过这个码
        const usedDevices: string[] = activationCode.usedDevices
            ? JSON.parse(activationCode.usedDevices)
            : [];

        if (usedDevices.includes(deviceId)) {
            // 同一设备重复激活：不扣次数，直接返回 token
            let user = await prisma.user.findUnique({ where: { deviceId } });
            if (!user) {
                return fail(404, {
                    code: 'USER_NOT_FOUND',
                    error: '我们没找到你的账号信息，所以没法帮你直接登录。',
                    reason: '该设备对应的用户记录不存在。',
                    next: '请使用年卡/试用码先激活一次创建账号；如果你之前激活过但找不到，请把设备信息发给我们排查。',
                });
            }
            const token = sign(
                { userId: user.id, deviceId: user.deviceId, role: user.role },
                JWT_SECRET_VALUE,
                { expiresIn: '365d' }
            );
            await prisma.user.update({ where: { id: user.id }, data: { currentToken: token } });
            return NextResponse.json({
                success: true,
                token,
                user: { userId: user.id, balance: user.points },
                message: '该设备已激活过此码，已重新登录',
            });
        }

        // 4. 事务处理（maxUses 检查移入事务内，避免并发竞态）
        let user: any;

        await prisma.$transaction(async (tx) => {
            // 事务内重新读取激活码并校验剩余次数，防止并发超额
            const lockedCode = await tx.activationCode.findUnique({ where: { id: activationCode.id } });
            if (!lockedCode || lockedCode.usedCount >= lockedCode.maxUses) {
                throw new Error('Activation code has reached maximum uses');
            }

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
            } else if (activationCode.type === 'trial') {
                // 试用码：7天订阅 + 100积分
                if (!user) {
                    user = await tx.user.create({
                        data: {
                            deviceId,
                            password: 'device-login',
                            name: `Device User ${deviceId.substring(0, 6)}`,
                            points: 100,
                            role: 'user',
                        },
                    });
                }
                const now = new Date();
                const base = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
                    ? user.subscriptionExpiresAt
                    : now;
                const newExpiry = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天
                const isFirstActivation = !user.subscriptionExpiresAt;

                user = await tx.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionExpiresAt: newExpiry,
                        ...(isFirstActivation ? { points: { increment: 100 } } : {}),
                    },
                });

                if (isFirstActivation) {
                    await tx.pointTransaction.create({
                        data: {
                            userId: user.id,
                            amount: 100,
                            type: 'trial',
                            description: '试用码激活赠送积分',
                            relatedId: activationCode.id,
                        },
                    });
                }
            } else if (activationCode.type === 'monthly') {
                // 月卡码：30天订阅 + 1500积分
                if (!user) {
                    user = await tx.user.create({
                        data: {
                            deviceId,
                            password: 'device-login',
                            name: `Device User ${deviceId.substring(0, 6)}`,
                            points: 1500,
                            role: 'user',
                        },
                    });
                }

                const now = new Date();
                const base = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
                    ? user.subscriptionExpiresAt
                    : now;
                const newExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天
                const isFirstActivation = !user.subscriptionExpiresAt;

                user = await tx.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionExpiresAt: newExpiry,
                        ...(isFirstActivation ? { points: { increment: 1500 } } : {}),
                    },
                });

                if (isFirstActivation) {
                    await tx.pointTransaction.create({
                        data: {
                            userId: user.id,
                            amount: 1500,
                            type: 'recharge',
                            description: '月卡激活赠送积分',
                            relatedId: activationCode.id,
                        },
                    });
                }
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

            // 7. 仅充值码需要额外记录流水（年卡/试用/月卡的流水已在上方各自分支中记录）
            if (user && activationCode.type === 'recharge' && activationCode.points > 0) {
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
            return fail(500, {
                code: 'ACTIVATE_FAILED',
                error: '激活没成功，系统没生成你的账号信息。',
                reason: '服务器处理激活流程时发生了异常。',
                next: '请稍等 10-30 秒再试一次；如果还是不行，把激活码和发生时间发给我们。',
            });
        }

        const token = sign(
            { userId: user.id, deviceId: user.deviceId, role: user.role },
            JWT_SECRET_VALUE,
            { expiresIn: '365d' }
        );

        await prisma.user.update({ where: { id: user.id }, data: { currentToken: token } });

        return NextResponse.json({
            success: true,
            token,
            user: {
                userId: user.id,
                balance: user.points,
            },
        });

    } catch (error: unknown) {
        console.error('Activate error:', error);

        const msg = String((error as { message?: unknown } | null)?.message ?? '');
        if (msg.includes('maximum uses')) {
            return fail(400, {
                code: 'ACTIVATION_CODE_MAX_USES',
                error: '这个激活码已经被用满了，暂时不能再激活。',
                reason: '该激活码的可用次数已达到上限。',
                next: '请换一个新的激活码；如果你觉得不应该用满，请把激活码和设备信息发给我们核对。',
            });
        }
        if (msg.startsWith('User not found for this device')) {
            return fail(400, {
                code: 'RECHARGE_NEEDS_ACCOUNT',
                error: '你用的是充值码，但这个设备还没创建账号，所以充不了。',
                reason: '充值码只能给已经激活过（有账号）的设备充值。',
                next: '请先用年卡/试用码激活一次创建账号，再用充值码充值。',
            });
        }
        if (msg.startsWith('Unsupported activation code type')) {
            return fail(400, {
                code: 'ACTIVATION_CODE_TYPE_UNSUPPORTED',
                error: '这个激活码类型我们暂时不支持。',
                reason: msg,
                next: '请联系鹏哥确认你买的激活码类型；或者换一个可用的激活码再试。',
            });
        }

        const mapped = mapError(error);
        return fail(mapped.status, mapped.body);
    }
}
