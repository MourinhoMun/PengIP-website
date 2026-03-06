import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyBearerToken } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyBearerToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: '授权失效，请重新激活' }, { status: 401 });
        }
        const { userId } = user;

        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        if (!dbUser) {
            return NextResponse.json({ error: '用户不存在' }, { status: 404 });
        }

        return NextResponse.json({ userId, points: dbUser.points, balance: dbUser.points });

    } catch (error) {
        console.error('Balance error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
