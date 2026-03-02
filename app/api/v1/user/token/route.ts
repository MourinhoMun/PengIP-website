import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// 用网页 session 换取客户端 JWT（供 PreVSim 等工具静默登录用）
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: '未登录，请先激活' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { id: true, points: true, subscriptionExpiresAt: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: '用户不存在' }, { status: 404 });
        }

        const now = new Date();
        if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt < now) {
            return NextResponse.json({
                error: '会员已过期，请重新激活',
                subscriptionRequired: true,
            }, { status: 403 });
        }

        const token = sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '365d' }
        );

        // 保存当前 token，踢掉旧设备
        await prisma.user.update({
            where: { id: user.id },
            data: { currentToken: token },
        });

        return NextResponse.json({
            success: true,
            token,
            user: {
                userId: user.id,
                balance: user.points,
                subscriptionExpiresAt: user.subscriptionExpiresAt,
            },
        });

    } catch (error) {
        console.error('Token exchange error:', error);
        return NextResponse.json({ error: '服务器错误' }, { status: 500 });
    }
}
