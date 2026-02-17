
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const COST_PER_IMAGE = 10; // Make this configurable later

export async function POST(request: NextRequest) {
    try {
        // 1. 鉴权
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing token' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = verify(token, JWT_SECRET) as any;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
        }

        const { userId } = decoded;

        // 2. 解析请求
        const body = await request.json();
        const { prompt, width, height, batch_size = 1 } = body;

        // 3. 计算费用
        const totalCost = COST_PER_IMAGE * Math.max(1, batch_size);

        // 4. 事务：检查余额并扣费
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

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

    } catch (error: any) {
        if (error.message === 'Insufficient points') {
            return NextResponse.json({ error: '积分不足' }, { status: 402 });
        }
        console.error('Generate proxy error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
