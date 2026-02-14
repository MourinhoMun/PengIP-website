import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

// 获取统计数据
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      todayUsers,
      totalToolUsages,
      todayToolUsages,
      activeTools,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.toolUsage.count(),
      prisma.toolUsage.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.tool.count({
        where: { status: 'active' },
      }),
    ]);

    // 获取最近7天的注册用户数
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        todayUsers,
        totalToolUsages,
        todayToolUsages,
        activeTools,
      },
      charts: {
        userRegistrations: last7Days,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
