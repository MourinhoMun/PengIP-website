import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';
import { fail, mapError } from '@/app/lib/apiError';
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
            const response = fail(401, {
                code: 'NOT_LOGGED_IN',
                error: '你还没登录主站，所以我们没法帮你自动登录到这个工具。',
                reason: '系统没有拿到你的登录状态（可能是你还没登录，或者浏览器没带上 cookie）。',
                next: '请先在 pengip.com 主站登录成功后，再打开这个工具页面；如果是浏览器隐私模式，建议换普通模式再试。',
            });
            return setCorsHeaders(response, origin);
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { id: true, points: true, subscriptionExpiresAt: true, role: true },
        });

        if (!user) {
            const response = fail(404, {
                code: 'USER_NOT_FOUND',
                error: '我们没找到你的账号信息。',
                reason: '可能是账号还没创建成功，或者登录状态对应的用户记录不存在。',
                next: '请回到主站重新登录/重新激活后再试；如果仍不行，把截图发给我们处理。',
            });
            return setCorsHeaders(response, origin);
        }

        const now = new Date();
        if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt < now) {
            const response = fail(403, {
                code: 'SUBSCRIPTION_REQUIRED',
                error: '你的会员到期了，这个工具暂时用不了。',
                reason: '系统检测到你的会员订阅已过期。',
                next: '请先在主站续费/重新激活会员后再试；如果你刚续费，刷新页面或重新登录再试一次。',
            });
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

    } catch (error: unknown) {
        console.error('Token exchange error:', error);
        const mapped = mapError(error);
        const response = fail(mapped.status, mapped.body);
        return setCorsHeaders(response, origin);
    }
}
