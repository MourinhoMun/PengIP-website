import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

export async function POST(request: NextRequest) {
    try {
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
            return NextResponse.json({ error: 'Insufficient points' }, { status: 402 });
        }
        if (error.message === 'SUBSCRIPTION_REQUIRED') {
            return NextResponse.json({ error: 'Subscription required', subscriptionRequired: true }, { status: 403 });
        }
        console.error('Proxy use error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
