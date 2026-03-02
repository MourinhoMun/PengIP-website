import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

async function checkAdmin() {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return null;
    return currentUser;
}

// DELETE: 删除激活码（仅限未使用的）
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const code = await prisma.activationCode.findUnique({ where: { id } });
        if (!code) {
            return NextResponse.json({ error: '激活码不存在' }, { status: 404 });
        }
        if (code.status === 'used') {
            return NextResponse.json({ error: '已使用的激活码不能删除' }, { status: 400 });
        }

        await prisma.activationCode.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
