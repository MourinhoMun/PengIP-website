import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyBearerToken } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyBearerToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        const { userId } = user;

        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ points: dbUser.points, balance: dbUser.points });

    } catch (error) {
        console.error('Balance error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
