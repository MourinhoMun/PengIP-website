import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

async function checkAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') return null;
  return currentUser;
}

export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: '无权限访问' }, { status: 403 });

    const sessions = await prisma.chatSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    return NextResponse.json({ error: '获取对话记录失败' }, { status: 500 });
  }
}
