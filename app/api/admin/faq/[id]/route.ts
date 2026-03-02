import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

async function checkAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') return null;
  return currentUser;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: '无权限访问' }, { status: 403 });

    const { id } = await params;
    const { question, answer, category, sortOrder, active } = await request.json();

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(category !== undefined && { category }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    console.error('Update FAQ error:', error);
    return NextResponse.json({ error: '更新FAQ失败' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: '无权限访问' }, { status: 403 });

    const { id } = await params;
    await prisma.fAQ.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    return NextResponse.json({ error: '删除FAQ失败' }, { status: 500 });
  }
}
