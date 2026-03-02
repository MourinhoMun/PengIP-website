import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyBearerToken } from '@/app/lib/auth';

// 客户端充值码激活（Bearer JWT 鉴权）
export async function POST(request: NextRequest) {
    try {
        const user = await verifyBearerToken(request.headers.get('Authorization'));
        if (!user) {
            return NextResponse.json({ error: '授权失效，请重新激活' }, { status: 401 });
        }
        const { userId } = user;
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const normalizedCode = code.trim().toUpperCase();

        const result = await prisma.$transaction(async (tx) => {
            const activation = await tx.activationCode.findUnique({
                where: { code: normalizedCode },
            });

            if (!activation) throw new Error('NOT_FOUND');
            if (activation.status === 'used') throw new Error('ALREADY_USED');
            if (activation.status === 'expired') throw new Error('EXPIRED');
            if (activation.type !== 'recharge') throw new Error('NOT_RECHARGE');
            if (activation.userId && activation.userId !== userId) throw new Error('NOT_YOURS');

            await tx.user.update({
                where: { id: userId },
                data: { points: { increment: activation.points } },
            });

            await tx.pointTransaction.create({
                data: {
                    userId,
                    amount: activation.points,
                    type: 'recharge',
                    description: '充值码激活',
                    relatedId: activation.id,
                },
            });

            await tx.activationCode.update({
                where: { id: activation.id },
                data: { status: 'used', userId, usedAt: new Date() },
            });

            const user = await tx.user.findUnique({ where: { id: userId } });
            return { points: activation.points, balance: user?.points ?? 0 };
        });

        return NextResponse.json({
            success: true,
            points: result.points,
            balance: result.balance,
        });

    } catch (error: any) {
        const errorMap: Record<string, { error: string; status: number }> = {
            NOT_FOUND: { error: '充值码不存在', status: 404 },
            ALREADY_USED: { error: '充值码已被使用', status: 400 },
            EXPIRED: { error: '充值码已过期', status: 400 },
            NOT_RECHARGE: { error: '该码不是充值码', status: 400 },
            NOT_YOURS: { error: '该充值码不属于你', status: 403 },
        };
        const mapped = errorMap[error.message];
        if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
        console.error('Recharge error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
