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
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    }
    return response;
}

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin');
    const response = new NextResponse(null, { status: 204 });
    return setCorsHeaders(response, origin);
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get('origin');
    try {
        const user = await verifyBearerToken(request.headers.get('Authorization'));
        if (!user) {
            const response = fail(401, {
                code: 'AUTH_EXPIRED',
                error: '登录信息失效了，暂时查不到你的余额。',
                reason: '你的授权信息已过期或不正确。',
                next: '请回到主站重新登录/重新激活后再试。',
            });
            return setCorsHeaders(response, origin);
        }
        const { userId } = user;

        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        if (!dbUser) {
            const response = fail(404, {
                code: 'USER_NOT_FOUND',
                error: '我们没找到你的账号信息，所以查不到余额。',
                reason: '登录信息对应的用户记录不存在。',
                next: '请回到主站重新登录/重新激活后再试；如果仍不行，把截图发给我们处理。',
            });
            return setCorsHeaders(response, origin);
        }

        const response = NextResponse.json({ userId, points: dbUser.points, balance: dbUser.points });
        return setCorsHeaders(response, origin);

    } catch (error: unknown) {
        console.error('Balance error:', error);
        const mapped = mapError(error);
        const response = fail(mapped.status, mapped.body);
        return setCorsHeaders(response, origin);
    }
}
