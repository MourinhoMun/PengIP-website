import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyPassword } from '@/app/lib/auth';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// AutoClip 桌面软件登录接口
// 接受 username（邮箱或手机号），返回 has_autoclip_permission
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'username and password are required' }, { status: 400 });
        }

        const isEmail = username.includes('@');
        const isPhone = /^1[3-9]\d{9}$/.test(username);

        if (!isEmail && !isPhone) {
            return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
        }

        // 查找用户（不存在返回 404）
        const user = await prisma.user.findFirst({
            where: isEmail ? { email: username } : { phone: username },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 验证密码（密码错误返回 401）
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // 检查是否有 autoclip 使用权限（年卡有效 = 有权限）
        const now = new Date();
        const has_autoclip_permission = !!(
            user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
        );

        // 生成 JWT（365天）
        const token = sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '365d' }
        );

        // 保存当前 token，踢掉旧设备
        await prisma.user.update({
            where: { id: user.id },
            data: { currentToken: token },
        });

        return NextResponse.json({
            token,
            has_autoclip_permission,
            balance: {
                points: user.points,
            },
        });

    } catch (error: any) {
        console.error('AutoClip login error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
