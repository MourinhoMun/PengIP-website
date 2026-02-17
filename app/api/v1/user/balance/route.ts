
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

export async function GET(request: NextRequest) {
    try {
        // 1. 鉴权
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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ balance: user.points });

    } catch (error) {
        console.error('Balance error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
