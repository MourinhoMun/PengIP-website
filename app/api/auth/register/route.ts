import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/app/lib/db';
import { hashPassword, generateToken, setAuthCookie } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password, inviteCode, captcha } = body;

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
    if (!password || (!email && !phone)) {
      return NextResponse.json(
        { error: '请提供邮箱或手机号和密码' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证手机号格式（中国大陆）
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      );
    }

    // 构建查询条件
    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (phone) whereConditions.push({ phone });

    // 检查用户是否已存在
    if (whereConditions.length > 0) {
      const existingUser = await prisma.user.findFirst({
        where: { OR: whereConditions },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: '该账号已被注册' },
          { status: 400 }
        );
      }
    }

    // 查找邀请人
    let inviterId: string | null = null;
    if (inviteCode) {
      const inviter = await prisma.user.findUnique({
        where: { inviteCode },
      });
      if (inviter) {
        inviterId = inviter.id;
      }
    }

    // 创建用户
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        invitedBy: inviterId,
        points: 100, // 注册送100积分
      },
    });

    // 记录注册积分
    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        amount: 100,
        type: 'register',
        description: '新用户注册奖励',
      },
    });

    // 如果有邀请人，给邀请人加积分
    if (inviterId) {
      await prisma.user.update({
        where: { id: inviterId },
        data: { points: { increment: 50 } },
      });

      await prisma.pointTransaction.create({
        data: {
          userId: inviterId,
          amount: 50,
          type: 'invite',
          description: '邀请新用户奖励',
          relatedId: user.id,
        },
      });
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
