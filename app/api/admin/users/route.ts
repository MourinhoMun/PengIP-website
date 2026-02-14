import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

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
              invitedUsers: true,
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
