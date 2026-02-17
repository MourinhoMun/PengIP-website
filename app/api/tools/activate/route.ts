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

    const normalizedCode = code.trim().toUpperCase();

    // 使用事务：原子性地查找 + 校验 + 更新激活码
    const result = await prisma.$transaction(async (tx) => {
      const activation = await tx.activationCode.findFirst({
        where: { code: normalizedCode },
        include: {
          tool: { select: { name: true, id: true } },
        },
      });

      if (!activation) {
        throw new Error('NOT_FOUND');
      }

      if (activation.status === 'used') {
        throw new Error('ALREADY_USED');
      }

      if (activation.status === 'expired') {
        throw new Error('EXPIRED');
      }

      if (activation.userId && activation.userId !== currentUser.userId) {
        throw new Error('NOT_YOURS');
      }

      await tx.activationCode.update({
        where: { id: activation.id },
        data: {
          status: 'used',
          userId: currentUser.userId,
          usedAt: new Date(),
        },
      });

      return activation;
    });

    return NextResponse.json({
      success: true,
      toolName: result.tool?.name || '未知工具',
      toolId: result.tool?.id || '',
      message: `已成功激活「${result.tool?.name || '工具'}」`,
    });
  } catch (error: any) {
    const errorMap: Record<string, { error: string; status: number }> = {
      NOT_FOUND: { error: '激活码不存在', status: 404 },
      ALREADY_USED: { error: '该激活码已被使用', status: 400 },
      EXPIRED: { error: '该激活码已过期', status: 400 },
      NOT_YOURS: { error: '该激活码不属于你', status: 403 },
    };
    const mapped = errorMap[error.message];
    if (mapped) {
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }
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
