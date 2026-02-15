
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

// GET: 获取全局激活码列表 (type != tool_activation)
export async function GET(request: NextRequest) {
    try {
        if (!await checkAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');

        const where: any = {
            toolId: null // 仅查询全局码
        };
        if (type) where.type = type;
        if (status) where.status = status;

        const codes = await prisma.activationCode.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100
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

        if (!['license', 'recharge'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type. Must be license or recharge' }, { status: 400 });
        }

        if (typeof points !== 'number' || points < 0) {
            return NextResponse.json({ error: 'Invalid points' }, { status: 400 });
        }

        const codes: string[] = [];
        // 简单去重逻辑 (实际生产应用更严谨的碰撞检测)
        for (let i = 0; i < count; i++) {
            codes.push(generateCode());
        }

        const results = [];
        for (const code of codes) {
            // Check existence
            const exists = await prisma.activationCode.findUnique({ where: { code } });
            if (!exists) {
                const res = await prisma.activationCode.create({
                    data: {
                        code,
                        type,
                        points,
                        status: 'unused',
                        note,
                        toolId: null // Explicitly null for global codes
                    }
                });
                results.push(res);
            }
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
