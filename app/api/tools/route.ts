import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';

// 获取工具列表
export async function GET() {
  try {
    const tools = await prisma.tool.findMany({
      where: { status: { not: 'inactive' }, visible: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        descriptionEn: true,
        icon: true,
        points: true,
        url: true,
        downloadUrl: true,
        status: true,
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
