import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser, hashPassword } from '@/app/lib/auth';

// 检查管理员权限
async function checkAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }
  return currentUser;
}

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const where = search
      ? {
        OR: [
          { email: { contains: search } },
          { phone: { contains: search } },
          { name: { contains: search } },
        ],
      }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          points: true,
          role: true,
          inviteCode: true,
          createdAt: true,
          _count: {
            select: {

              toolUsages: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// 新增用户
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const body = await request.json();
    const { email, phone, name, password, points = 100, role = 'user' } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: '请填写邮箱或手机号' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: '角色无效' }, { status: 400 });
    }

    // 检查邮箱/手机号是否已存在
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
      }
    }
    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return NextResponse.json({ error: '该手机号已注册' }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        name: name || null,
        password: hashedPassword,
        points: Math.max(0, points),
        role,
      },
    });

    // 记录初始积分
    if (points > 0) {
      await prisma.pointTransaction.create({
        data: {
          userId: user.id,
          amount: points,
          type: 'admin_adjust',
          description: '管理员创建账号赠送积分',
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, phone: user.phone, name: user.name, points: user.points, role: user.role },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
  }
}
