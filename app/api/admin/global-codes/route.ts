
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';
import crypto from 'crypto';

// 检查管理员权限
async function checkAdmin() {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return null;
    return currentUser;
}

// 生成激活码 (XXXX-XXXX-XXXX-XXXX)
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments = [];
    for (let s = 0; s < 4; s++) {
        let seg = '';
        for (let i = 0; i < 4; i++) {
            seg += chars[crypto.randomInt(0, chars.length)];
        }
        segments.push(seg);
    }
    return segments.join('-');
}

// GET: 获取全局激活码列表
export async function GET(request: NextRequest) {
    try {
        if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const search = searchParams.get('search') || '';

        const where: any = { toolId: null };
        if (type) where.type = type;
        if (status) where.status = status;
        if (search) where.code = { contains: search.toUpperCase() };

        const codes = await prisma.activationCode.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 200
        });

        return NextResponse.json({ codes });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST: 批量生成全局激活码
export async function POST(request: NextRequest) {
    try {
        if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { type, points, count = 1, note } = body;

        // Default device limit: annual codes allow 2 devices; others keep schema default.
        const maxUses = type === 'annual' ? 2 : undefined;

        if (!['annual', 'recharge', 'trial', 'monthly'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type. Must be annual, monthly, recharge or trial' }, { status: 400 });
        }

        if (type === 'recharge' && (typeof points !== 'number' || points < 0)) {
            return NextResponse.json({ error: 'Invalid points' }, { status: 400 });
        }

        // monthly is fixed internally: 1500 points and 30 days subscription handled in activate route
        if (type === 'monthly') {
            // Keep points at 0 to avoid double-counting in pointTransaction later.
        }

        const safeCount = Math.min(Math.max(Number(count) || 1, 1), 200);

        // 使用 while 循环保证生成足够数量，碰撞时重试
        const generatedCodes = new Set<string>();
        while (generatedCodes.size < safeCount) {
            generatedCodes.add(generateCode());
        }

        const results = [];
        for (const code of generatedCodes) {
            const exists = await prisma.activationCode.findUnique({ where: { code } });
            if (exists) continue; // 极低概率碰撞，跳过并继续（下次请求会补）
            const res = await prisma.activationCode.create({
                data: {
                    code,
                    type,
                    points: points ?? 0,
                    status: 'unused',
                    note,
                    ...(maxUses ? { maxUses } : {}),
                    toolId: null,
                }
            });
            results.push(res);
        }

        return NextResponse.json({
            success: true,
            count: results.length,
            codes: results
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
