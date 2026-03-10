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

      if (activation.status === 'suspended') {
        throw new Error('SUSPENDED');
      }

      if (activation.userId && activation.userId !== currentUser.userId) {
        throw new Error('NOT_YOURS');
      }

      // 年卡类型：更新订阅到期时间
      if (activation.type === 'annual') {
        const user = await tx.user.findUnique({ where: { id: currentUser.userId } });
        if (!user) throw new Error('USER_NOT_FOUND');

        const now = new Date();
        const base = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
          ? user.subscriptionExpiresAt
          : now;
        const newExpiry = new Date(base.getTime() + 365 * 24 * 60 * 60 * 1000);
        const isFirstActivation = !user.subscriptionExpiresAt;

        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionExpiresAt: newExpiry,
            ...(isFirstActivation ? { points: { increment: 1000 } } : {}),
          },
        });

        if (isFirstActivation) {
          await tx.pointTransaction.create({
            data: {
              userId: user.id,
              amount: 1000,
              type: 'recharge',
              description: '年卡激活赠送积分',
              relatedId: activation.id,
            },
          });
        }

        await tx.activationCode.update({
          where: { id: activation.id },
          data: { status: 'used', userId: currentUser.userId, usedAt: new Date() },
        });

        return { type: 'annual', newExpiry, isFirstActivation };
      }

      // 充值类型：增加积分
      if (activation.type === 'recharge') {
        await tx.user.update({
          where: { id: currentUser.userId },
          data: { points: { increment: activation.points } },
        });

        await tx.pointTransaction.create({
          data: {
            userId: currentUser.userId,
            amount: activation.points,
            type: 'recharge',
            description: `充值码激活`,
            relatedId: activation.id,
          },
        });

        await tx.activationCode.update({
          where: { id: activation.id },
          data: { status: 'used', userId: currentUser.userId, usedAt: new Date() },
        });

        return { type: 'recharge', points: activation.points };
      }

      // 试用类型：7天订阅 + 首次激活赠送100积分
      if (activation.type === 'trial') {
        const user = await tx.user.findUnique({ where: { id: currentUser.userId } });
        if (!user) throw new Error('USER_NOT_FOUND');

        const now = new Date();
        const base = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
          ? user.subscriptionExpiresAt
          : now;
        const newExpiry = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
        const isFirstActivation = !user.subscriptionExpiresAt;

        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionExpiresAt: newExpiry,
            ...(isFirstActivation ? { points: { increment: 100 } } : {}),
          },
        });

        if (isFirstActivation) {
          await tx.pointTransaction.create({
            data: {
              userId: user.id,
              amount: 100,
              type: 'recharge',
              description: '试用码激活赠送积分',
              relatedId: activation.id,
            },
          });
        }

        await tx.activationCode.update({
          where: { id: activation.id },
          data: { status: 'used', userId: currentUser.userId, usedAt: new Date() },
        });

        return { type: 'trial', newExpiry, isFirstActivation };
      }

      // 不支持的类型
      throw new Error('UNSUPPORTED_TYPE');
    });

    if (result.type === 'annual' && result.newExpiry) {
      return NextResponse.json({
        success: true,
        message: `年卡激活成功，有效期至 ${result.newExpiry.toLocaleDateString('zh-CN')}${result.isFirstActivation ? '，已赠送 1000 积分' : ''}`,
        subscriptionExpiresAt: result.newExpiry,
      });
    }

    if (result.type === 'recharge') {
      return NextResponse.json({
        success: true,
        message: `充值成功，已增加 ${result.points} 积分`,
        points: result.points,
      });
    }

    if (result.type === 'trial' && result.newExpiry) {
      return NextResponse.json({
        success: true,
        message: `试用码激活成功，有效期至 ${result.newExpiry.toLocaleDateString('zh-CN')}${result.isFirstActivation ? '，已赠送 100 积分' : ''}`,
        subscriptionExpiresAt: result.newExpiry,
      });
    }

    return NextResponse.json({ error: '不支持的激活码类型' }, { status: 400 });
  } catch (error: any) {
    const errorMap: Record<string, { error: string; status: number }> = {
      NOT_FOUND: { error: '激活码不存在', status: 404 },
      ALREADY_USED: { error: '该激活码已被使用', status: 400 },
      EXPIRED: { error: '该激活码已过期', status: 400 },
      SUSPENDED: { error: '该激活码已被暂停使用', status: 400 },
      NOT_YOURS: { error: '该激活码不属于你', status: 403 },
      USER_NOT_FOUND: { error: '用户不存在', status: 404 },
      UNSUPPORTED_TYPE: { error: '不支持的激活码类型', status: 400 },
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
