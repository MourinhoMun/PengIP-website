import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/app/lib/db';
import { verifyPassword, generateToken, setAuthCookie } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, password, captcha } = body;

    // 验证验证码
    if (!captcha) {
      return NextResponse.json(
        { error: '请输入验证码' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const storedCaptcha = cookieStore.get('captcha')?.value;

    if (!storedCaptcha || captcha.toLowerCase() !== storedCaptcha) {
      return NextResponse.json(
        { error: '验证码错误' },
        { status: 400 }
      );
    }

    // 清除验证码
    cookieStore.delete('captcha');

    // 验证必填字段
    if (!password || !account) {
      return NextResponse.json(
        { error: '请输入账号和密码' },
        { status: 400 }
      );
    }

    // 判断账号类型（邮箱或手机号）
    const isEmail = account.includes('@');
    const isPhone = /^1[3-9]\d{9}$/.test(account);

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { error: '请输入有效的邮箱或手机号' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: account } : { phone: account },
    });

    if (!user) {
      return NextResponse.json(
        { error: '账号或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: '账号或密码错误' },
        { status: 401 }
      );
    }

    // 生成 Token
    const token = generateToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role,
    });

    // 设置 Cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        points: user.points,
        inviteCode: user.inviteCode,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
