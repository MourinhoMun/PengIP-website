import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';
import crypto from 'crypto';

async function checkAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') return null;
  return currentUser;
}

// 生成激活码（格式: XXXX-XXXX-XXXX-XXXX）
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      seg += chars[randomIndex];
    }
    segments.push(seg);
  }
  return segments.join('-');
}

// 获取某工具的激活码列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 可选过滤

    const where: Record<string, unknown> = { toolId: id };
    if (status) where.status = status;

    const codes = await prisma.activationCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // 统计各状态数量
    const stats = {
      total: await prisma.activationCode.count({ where: { toolId: id } }),
      unused: await prisma.activationCode.count({ where: { toolId: id, status: 'unused' } }),
      assigned: await prisma.activationCode.count({ where: { toolId: id, status: 'assigned' } }),
      used: await prisma.activationCode.count({ where: { toolId: id, status: 'used' } }),
    };

    return NextResponse.json({ codes, stats });
  } catch (error) {
    console.error('Get codes error:', error);
    return NextResponse.json({ error: '获取激活码失败' }, { status: 500 });
  }
}

// 批量生成激活码
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const count = Math.min(Math.max(body.count || 1, 1), 100); // 1~100个
    const note = body.note || null;

    // 检查工具是否存在
    const tool = await prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }

    // 生成激活码
    const codes: string[] = [];
    const existingCodes = new Set(
      (await prisma.activationCode.findMany({
        where: { toolId: id },
        select: { code: true },
      })).map((c: { code: string }) => c.code)
    );

    while (codes.length < count) {
      const code = generateCode();
      if (!existingCodes.has(code)) {
        codes.push(code);
        existingCodes.add(code);
      }
    }

    // 批量插入
    const created = [];
    for (const code of codes) {
      const record = await prisma.activationCode.create({
        data: {
          code,
          toolId: id,
          status: 'unused',
          note,
        },
      });
      created.push(record);
    }

    return NextResponse.json({
      success: true,
      count: created.length,
      codes: created,
    });
  } catch (error) {
    console.error('Generate codes error:', error);
    return NextResponse.json({ error: '生成激活码失败' }, { status: 500 });
  }
}

// 更新激活码（分配给用户 / 修改备注 / 作废）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await params; // id 是 toolId，但实际用 body 中的 codeId
    const body = await request.json();
    const { codeId, action, userId, note } = body;

    if (!codeId) {
      return NextResponse.json({ error: '缺少 codeId' }, { status: 400 });
    }

    const code = await prisma.activationCode.findUnique({ where: { id: codeId } });
    if (!code) {
      return NextResponse.json({ error: '激活码不存在' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (action === 'assign' && userId) {
      updateData.userId = userId;
      updateData.status = 'assigned';
    } else if (action === 'expire') {
      updateData.status = 'expired';
    } else if (action === 'reset') {
      updateData.userId = null;
      updateData.status = 'unused';
      updateData.usedAt = null;
    }

    if (note !== undefined) {
      updateData.note = note;
    }

    const updated = await prisma.activationCode.update({
      where: { id: codeId },
      data: updateData,
    });

    return NextResponse.json({ success: true, code: updated });
  } catch (error) {
    console.error('Update code error:', error);
    return NextResponse.json({ error: '更新激活码失败' }, { status: 500 });
  }
}
