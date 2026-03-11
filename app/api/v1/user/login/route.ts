import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { verifyPassword } from '@/app/lib/auth';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

// Tell TS that JWT_SECRET is definitely a string after the runtime check.
const JWT_SECRET_VALUE: string = JWT_SECRET;

// 客户端软件登录接口（无验证码，返回 JWT）
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { account, password } = body;

        if (!account || !password) {
            return NextResponse.json({ error: 'account and password are required' }, { status: 400 });
        }

        // 判断账号类型
        const isEmail = account.includes('@');
        const isPhone = /^1[3-9]\d{9}$/.test(account);

        if (!isEmail && !isPhone) {
            return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
        }

        // 查找用户
        const user = await prisma.user.findFirst({
            where: isEmail ? { email: account } : { phone: account },
        });

        if (!user) {
            return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
        }

        // 验证密码
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
        }

        // 检查年卡是否有效
        const now = new Date();
        if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt < now) {
            return NextResponse.json({
                error: 'No active subscription. Please activate your annual card first.',
                subscriptionRequired: true,
            }, { status: 403 });
        }

        // 生成 JWT（365天，与设备激活保持一致）
        const token = sign(
            { userId: user.id, role: user.role },
            JWT_SECRET_VALUE,
            { expiresIn: '365d' }
        );

        // 保存当前 token，踢掉旧设备
        await prisma.user.update({
            where: { id: user.id },
            data: { currentToken: token },
        });

        return NextResponse.json({
            success: true,
            token,
            user: {
                userId: user.id,
                balance: user.points,
                subscriptionExpiresAt: user.subscriptionExpiresAt,
            },
        });

    } catch (error: any) {
        console.error('Client login error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
