import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 验证验证码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { captcha } = body;

    if (!captcha) {
      return NextResponse.json(
        { valid: false, error: '请输入验证码' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const storedCaptcha = cookieStore.get('captcha')?.value;

    if (!storedCaptcha) {
      return NextResponse.json(
        { valid: false, error: '验证码已过期，请刷新' },
        { status: 400 }
      );
    }

    const isValid = captcha.toLowerCase() === storedCaptcha;

    if (isValid) {
      // 验证成功后删除验证码
      cookieStore.delete('captcha');
    }

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Verify captcha error:', error);
    return NextResponse.json(
      { valid: false, error: '验证失败' },
      { status: 500 }
    );
  }
}
