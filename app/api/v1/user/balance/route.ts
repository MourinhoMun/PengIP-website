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
            const response = NextResponse.json({ error: '授权失效，请重新激活' }, { status: 401 });
            return setCorsHeaders(response, origin);
        }
        const { userId } = user;

        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        if (!dbUser) {
            const response = NextResponse.json({ error: '用户不存在' }, { status: 404 });
            return setCorsHeaders(response, origin);
        }

        const response = NextResponse.json({ userId, points: dbUser.points, balance: dbUser.points });
        return setCorsHeaders(response, origin);

    } catch (error) {
        console.error('Balance error:', error);
        const response = NextResponse.json({ error: 'Server error' }, { status: 500 });
        return setCorsHeaders(response, origin);
    }
}
