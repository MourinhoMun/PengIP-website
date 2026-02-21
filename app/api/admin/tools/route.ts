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

// 获取工具列表（管理员）
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const tools = await prisma.tool.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Get tools error:', error);
    return NextResponse.json(
      { error: '获取工具列表失败' },
      { status: 500 }
    );
  }
}

// 创建新工具
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, nameEn, description, descriptionEn, icon, points, url, downloadUrl, status, sortOrder } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: '请填写工具名称和描述' },
        { status: 400 }
      );
    }

    const tool = await prisma.tool.create({
      data: {
        name,
        nameEn: nameEn || null,
        description,
        descriptionEn: descriptionEn || null,
        icon: icon || null,
        points: points || 5,
        url: url || null,
        downloadUrl: downloadUrl || null,
        status: status || 'active',
        sortOrder: sortOrder || 0,
        visible: body.visible !== undefined ? body.visible : true,
      },
    });

    return NextResponse.json({ success: true, tool });
  } catch (error) {
    console.error('Create tool error:', error);
    return NextResponse.json(
      { error: '创建工具失败' },
      { status: 500 }
    );
  }
}
