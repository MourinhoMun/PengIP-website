import { NextRequest, NextResponse } from 'next/server';
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

    const faqs = await prisma.fAQ.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Get FAQs error:', error);
    return NextResponse.json({ error: '获取FAQ失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) return NextResponse.json({ error: '无权限访问' }, { status: 403 });

    const { question, answer, category, sortOrder, active } = await request.json();
    if (!question || !answer) {
      return NextResponse.json({ error: '问题和答案不能为空' }, { status: 400 });
    }

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        category: category || 'general',
        sortOrder: sortOrder ?? 0,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    console.error('Create FAQ error:', error);
    return NextResponse.json({ error: '创建FAQ失败' }, { status: 500 });
  }
}
