import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyBearerToken } from '@/app/lib/auth';

const ALLOWED_ORIGINS = [
    'https://seedocinchina.com',
    'https://www.seedocinchina.com',
];

function setCorsHeaders(response: NextResponse, origin?: string | null) {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    }
    return response;
}

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin');
    const response = new NextResponse(null, { status: 204 });
    return setCorsHeaders(response, origin);
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin');
    try {
        const user = await verifyBearerToken(request.headers.get('Authorization'));
        if (!user) {
            const response = NextResponse.json({ error: '授权失效，请重新激活' }, { status: 401 });
            return setCorsHeaders(response, origin);
        }
        const { userId } = user;

        const body = await request.json();
        const { software } = body;

        if (!software) {
            const response = NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
            return setCorsHeaders(response, origin);
        }

        const tool = await prisma.tool.findFirst({
            where: { nameEn: software, status: 'active' },
        });

        if (!tool) {
            const response = NextResponse.json({ error: '未知的工具: ' + software }, { status: 404 });
            return setCorsHeaders(response, origin);
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

        const response = NextResponse.json({
            success: true,
            remaining_points: result.points,
            cost: cost,
        });
        return setCorsHeaders(response, origin);

    } catch (error: any) {
        if (error.message === 'Insufficient points') {
            const response = NextResponse.json({ error: '积分不足，请充值' }, { status: 402 });
            return setCorsHeaders(response, origin);
        }
        if (error.message === 'SUBSCRIPTION_REQUIRED') {
            const response = NextResponse.json({ error: '需要会员订阅', subscriptionRequired: true }, { status: 403 });
            return setCorsHeaders(response, origin);
        }
        console.error('Proxy use error:', error);
        const response = NextResponse.json({ error: error.message || '服务器错误' }, { status: 500 });
        return setCorsHeaders(response, origin);
    }
}
