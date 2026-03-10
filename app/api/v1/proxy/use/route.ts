import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyBearerToken } from '@/app/lib/auth';
import { fail, mapError } from '@/app/lib/apiError';

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
            const response = fail(401, {
                code: 'AUTH_EXPIRED',
                error: '登录信息失效了，你需要重新登录/激活一下。',
                reason: '你的授权信息已过期或不正确。',
                next: '回到 pengip.com 主站重新登录后再试；如果你是激活码用户，请重新输入激活码激活。',
            });
            return setCorsHeaders(response, origin);
        }
        const { userId } = user;

        const body = await request.json();
        const { software } = body;

        if (!software) {
            const response = fail(400, {
                code: 'MISSING_PARAMETER',
                error: '这次请求少了必要信息，所以没法继续。',
                reason: '缺少参数 software（工具标识）。',
                next: '请刷新页面重试；如果你是从子应用调用，请联系我检查子应用传参是否正确。',
            });
            return setCorsHeaders(response, origin);
        }

        const tool = await prisma.tool.findFirst({
            where: { nameEn: software, status: 'active' },
        });

        if (!tool) {
            const response = fail(404, {
                code: 'TOOL_NOT_FOUND',
                error: '这个功能我们暂时没识别到，可能还没开通或已经下线了。',
                reason: `找不到工具标识：${software}`,
                next: '请确认你访问的是最新版本页面；如果是新功能刚上线，等 1-2 分钟再刷新试试。',
            });
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

    } catch (error: unknown) {
        console.error('Proxy use error:', error);
        const mapped = mapError(error);
        const response = fail(mapped.status, mapped.body);
        return setCorsHeaders(response, origin);
    }
}
