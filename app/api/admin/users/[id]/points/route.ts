import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

// 调整用户积分
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, description } = body;

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { error: '请输入有效的积分数量' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 更新积分
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { points: { increment: amount } },
    });

    // 记录交易
    await prisma.pointTransaction.create({
      data: {
        userId: id,
        amount,
        type: 'admin_adjust',
        description: description || `管理员调整积分 ${amount > 0 ? '+' : ''}${amount}`,
      },
    });

    return NextResponse.json({
      success: true,
      newPoints: updatedUser.points,
    });
  } catch (error) {
    console.error('Adjust points error:', error);
    return NextResponse.json(
      { error: '调整积分失败' },
      { status: 500 }
    );
  }
}
