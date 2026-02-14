import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

// 用户使用激活码激活工具
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '请先登录', needLogin: true }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '请输入激活码' }, { status: 400 });
    }

    // 标准化激活码格式
    const normalizedCode = code.trim().toUpperCase();

    // 查找激活码
    const activation = await prisma.activationCode.findFirst({
      where: {
        code: normalizedCode,
      },
      include: {
        tool: {
          select: { name: true, id: true },
        },
      },
    });

    if (!activation) {
      return NextResponse.json({ error: '激活码不存在' }, { status: 404 });
    }

    if (activation.status === 'used') {
      return NextResponse.json({ error: '该激活码已被使用' }, { status: 400 });
    }

    if (activation.status === 'expired') {
      return NextResponse.json({ error: '该激活码已过期' }, { status: 400 });
    }

    // 如果激活码已分配给特定用户，检查是否匹配
    if (activation.userId && activation.userId !== currentUser.userId) {
      return NextResponse.json({ error: '该激活码不属于你' }, { status: 403 });
    }

    // 激活
    await prisma.activationCode.update({
      where: { id: activation.id },
      data: {
        status: 'used',
        userId: currentUser.userId,
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      toolName: activation.tool.name,
      toolId: activation.tool.id,
      message: `已成功激活「${activation.tool.name}」`,
    });
  } catch (error) {
    console.error('Activate error:', error);
    return NextResponse.json({ error: '激活失败，请稍后重试' }, { status: 500 });
  }
}

// 获取用户已激活的工具列表
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const activations = await prisma.activationCode.findMany({
      where: {
        userId: currentUser.userId,
        status: 'used',
      },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            icon: true,
            downloadUrl: true,
          },
        },
      },
      orderBy: { usedAt: 'desc' },
    });

    return NextResponse.json({ activations });
  } catch (error) {
    console.error('Get activations error:', error);
    return NextResponse.json({ error: '获取激活记录失败' }, { status: 500 });
  }
}
