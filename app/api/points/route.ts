import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

// 获取积分历史
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const transactions = await prisma.pointTransaction.findMany({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { points: true },
    });

    return NextResponse.json({
      currentPoints: user?.points || 0,
      transactions,
    });
  } catch (error) {
    console.error('Get points error:', error);
    return NextResponse.json(
      { error: '获取积分记录失败' },
      { status: 500 }
    );
  }
}
