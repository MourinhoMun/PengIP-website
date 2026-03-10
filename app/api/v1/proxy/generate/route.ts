
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyBearerToken } from '@/app/lib/auth';
import { fail, mapError } from '@/app/lib/apiError';

const COST_PER_IMAGE = 10;

export async function POST(request: NextRequest) {
    try {
        const user = await verifyBearerToken(request.headers.get('Authorization'));
        if (!user) {
            return fail(401, {
                code: 'AUTH_EXPIRED',
                error: '登录信息失效了，你需要重新登录/激活一下才能继续生成。',
                reason: '你的授权信息已过期或不正确。',
                next: '请回到主站重新登录后再试；如果你是激活码用户，请重新输入激活码激活。',
            });
        }
        const { userId } = user;

        // 2. 解析请求
        const body = await request.json();
        const { prompt, width, height, batch_size = 1 } = body;

        // 3. 计算费用
        const totalCost = COST_PER_IMAGE * Math.max(1, batch_size);

        // 4. 事务：检查余额并扣费
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            const now = new Date();
            if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt < now) {
                throw new Error('SUBSCRIPTION_REQUIRED');
            }

            if (user.points < totalCost) {
                throw new Error('Insufficient points');
            }

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { points: { decrement: totalCost } }
            });

            // 记录交易
            await tx.pointTransaction.create({
                data: {
                    userId: userId,
                    amount: -totalCost,
                    type: 'use_tool',
                    description: `Generate Image (Batch: ${batch_size})`,
                    relatedId: 'proxy_generation' // Placeholder
                }
            });

            return updatedUser;
        });

        // 5. 调用 AI (Proxy)
        // TODO: 调用真实的 Midjourney/SD API. 
        // 此处仅为演示，返回 Mock 数据，因为我无法连接外部真实 AI 服务。
        // 在实际生产中，这里使用 axios/fetch 调用 AI 服务商。

        // Mock response
        const mockImages = Array(batch_size).fill(0).map((_, i) =>
            `https://placehold.co/${width || 1024}x${height || 1024}?text=AI+Gen+${i + 1}`
        );

        return NextResponse.json({
            success: true,
            images: mockImages,
            remaining_points: result.points,
            cost: totalCost
        });

    } catch (error: unknown) {
        console.error('Generate proxy error:', error);
        const mapped = mapError(error);
        return fail(mapped.status, mapped.body);
    }
}
