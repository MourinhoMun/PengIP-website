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

// 更新工具
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const tool = await prisma.tool.update({
      where: { id },
      data: {
        name: body.name,
        nameEn: body.nameEn,
        description: body.description,
        descriptionEn: body.descriptionEn,
        icon: body.icon,
        points: body.points,
        url: body.url,
        downloadUrl: body.downloadUrl,
        tutorialUrl: body.tutorialUrl,
        tutorialContent: body.tutorialContent || null,
        status: body.status,
        sortOrder: body.sortOrder,
        visible: body.visible !== undefined ? body.visible : undefined,
        apiUrl: body.apiUrl || null,
        apiKey: body.apiKey || null,
        category: body.category || 'doctor_ip',
        industry: body.industry || 'general',
      },
    });

    return NextResponse.json({ success: true, tool });
  } catch (error) {
    console.error('Update tool error:', error);
    return NextResponse.json(
      { error: '更新工具失败' },
      { status: 500 }
    );
  }
}

// 删除工具
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: '无权限访问' },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.tool.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tool error:', error);
    return NextResponse.json(
      { error: '删除工具失败' },
      { status: 500 }
    );
  }
}
