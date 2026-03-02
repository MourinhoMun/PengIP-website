import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyBearerToken } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyBearerToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: '授权失效，请重新激活' }, { status: 401 });
        }
        const { userId } = user;

        const body = await request.json();
        const { software } = body;

        if (!software) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        const tool = await prisma.tool.findFirst({
            where: { nameEn: software, status: 'active' },
        });

        if (!tool) {
            return NextResponse.json({ error: '未知的工具: ' + software }, { status: 404 });
        }

        const cost = tool.points;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            const now = new Date();
            if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt < now) {
                throw new Error('SUBSCRIPTION_REQUIRED');
            }

            if (user.points < cost) {
                throw new Error('Insufficient points');
            }

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { points: { decrement: cost } },
            });

            await tx.toolUsage.create({
                data: {
                    userId: userId,
                    toolId: tool.id,
                    points: cost,
                },
            });

            await tx.pointTransaction.create({
                data: {
                    userId: userId,
                    amount: -cost,
                    type: 'use_tool',
                    description: 'Use tool: ' + tool.name,
                    relatedId: tool.id,
                },
            });

            return updatedUser;
        });

        return NextResponse.json({
            success: true,
            remaining_points: result.points,
            cost: cost,
        });

    } catch (error: any) {
        if (error.message === 'Insufficient points') {
            return NextResponse.json({ error: '积分不足，请充值' }, { status: 402 });
        }
        if (error.message === 'SUBSCRIPTION_REQUIRED') {
            return NextResponse.json({ error: '需要会员订阅', subscriptionRequired: true }, { status: 403 });
        }
        console.error('Proxy use error:', error);
        return NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
    }
}
