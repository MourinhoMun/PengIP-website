import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, question: true, answer: true, category: true },
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Get FAQs error:', error);
    return NextResponse.json({ error: '获取FAQ失败' }, { status: 500 });
  }
}
