import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

// 使用工具（扣除积分）
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: '请先登录', needLogin: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { toolId } = body;

    if (!toolId) {
      return NextResponse.json(
        { error: '请指定工具' },
        { status: 400 }
      );
    }

    // 获取工具信息
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return NextResponse.json(
        { error: '工具不存在' },
        { status: 404 }
      );
    }

    if (tool.status !== 'active') {
      return NextResponse.json(
        { error: '该工具暂不可用' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查积分是否足够
    if (user.points < tool.points) {
      return NextResponse.json(
        { 
          error: '积分不足',
          needPoints: tool.points,
          currentPoints: user.points,
        },
        { status: 400 }
      );
    }

    // 扣除积分
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { decrement: tool.points } },
    });

    // 记录使用
    await prisma.toolUsage.create({
      data: {
        userId: user.id,
        toolId: tool.id,
        points: tool.points,
      },
    });

    // 记录积分交易
    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        amount: -tool.points,
        type: 'use_tool',
        description: `使用工具: ${tool.name}`,
        relatedId: tool.id,
      },
    });

    return NextResponse.json({
      success: true,
      remainingPoints: user.points - tool.points,
      toolUrl: tool.url,
    });
  } catch (error) {
    console.error('Use tool error:', error);
    return NextResponse.json(
      { error: '使用工具失败' },
      { status: 500 }
    );
  }
}
