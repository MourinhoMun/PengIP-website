import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

const ALLOWED_ORIGINS = [
    'https://seedocinchina.com',
    'https://www.seedocinchina.com',
];

function setCorsHeaders(response: NextResponse, origin?: string | null) {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    return response;
}

export async function OPTIONS(request: Request) {
    const origin = request.headers.get('origin');
    const response = new NextResponse(null, { status: 204 });
    return setCorsHeaders(response, origin);
}

// 用网页 session 换取客户端 JWT（供子应用静默登录用）
export async function GET(request: Request) {
    const origin = request.headers.get('origin');
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            const response = NextResponse.json({ error: '未登录，请先登录主站' }, { status: 401 });
            return setCorsHeaders(response, origin);
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { id: true, points: true, subscriptionExpiresAt: true, role: true },
        });

        if (!user) {
            const response = NextResponse.json({ error: '用户不存在' }, { status: 404 });
            return setCorsHeaders(response, origin);
        }

        const now = new Date();
        if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt < now) {
            const response = NextResponse.json({
                error: '会员已过期，请在主站重新激活',
                subscriptionRequired: true,
            }, { status: 403 });
            return setCorsHeaders(response, origin);
        }

        const token = sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '365d' }
        );

        // 保存当前 token
        await prisma.user.update({
            where: { id: user.id },
            data: { currentToken: token },
        });

        const response = NextResponse.json({
            success: true,
            token,
            user: {
                userId: user.id,
                balance: user.points,
                subscriptionExpiresAt: user.subscriptionExpiresAt,
            },
        });
        return setCorsHeaders(response, origin);

    } catch (error) {
        console.error('Token exchange error:', error);
        const response = NextResponse.json({ error: '服务器错误' }, { status: 500 });
        return setCorsHeaders(response, origin);
    }
}
