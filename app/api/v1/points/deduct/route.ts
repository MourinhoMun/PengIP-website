import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyBearerToken } from '@/app/lib/auth';

// AutoClip 桌面软件积分扣除接口
// Body: { software: "ai-director", points: 50 }（points 字段仅参考，实际以数据库为准）
export async function POST(request: NextRequest) {
    try {
        const user = await verifyBearerToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        const { userId } = user;

        const body = await request.json();
        const { software } = body;

        if (!software) {
            return NextResponse.json({ error: 'Missing software parameter' }, { status: 400 });
        }

        const tool = await prisma.tool.findFirst({
            where: { nameEn: software, status: 'active' },
        });

        if (!tool) {
            return NextResponse.json({ error: 'Unknown software: ' + software }, { status: 404 });
        }

        const cost = tool.points;

        const result = await prisma.$transaction(async (tx) => {
            const dbUser = await tx.user.findUnique({ where: { id: userId } });
            if (!dbUser) throw new Error('User not found');

            if (dbUser.points < cost) {
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
            ok: true,
            remaining_points: result.points,
        });

    } catch (error: any) {
        if (error.message === 'Insufficient points') {
            return NextResponse.json({ error: 'Insufficient points' }, { status: 402 });
        }
        console.error('Points deduct error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
