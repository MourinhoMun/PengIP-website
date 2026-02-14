import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 生成随机验证码
function generateCaptchaText(length: number = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成随机颜色
function randomColor(): string {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 生成 SVG 验证码
function generateSvgCaptcha(text: string): string {
  const width = 120;
  const height = 40;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // 背景
  svg += `<rect width="100%" height="100%" fill="#f8fafc"/>`;
  
  // 干扰线
  for (let i = 0; i < 4; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${randomColor()}" stroke-width="1" opacity="0.3"/>`;
  }
  
  // 干扰点
  for (let i = 0; i < 20; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    svg += `<circle cx="${cx}" cy="${cy}" r="1" fill="${randomColor()}" opacity="0.5"/>`;
  }
  
  // 文字
  const charWidth = width / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const x = charWidth * (i + 0.7);
    const y = height / 2 + 8;
    const rotate = Math.random() * 20 - 10;
    const color = randomColor();
    svg += `<text x="${x}" y="${y}" font-size="24" font-weight="bold" fill="${color}" transform="rotate(${rotate} ${x} ${y})" font-family="Arial, sans-serif">${text[i]}</text>`;
  }
  
  svg += '</svg>';
  return svg;
}

// 生成验证码
export async function GET() {
  try {
    const text = generateCaptchaText();
    const svg = generateSvgCaptcha(text);

    // 存储验证码到 cookie
    const cookieStore = await cookies();
    cookieStore.set('captcha', text.toLowerCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5分钟有效
      path: '/',
    });

    // 返回 SVG 图片
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Captcha error:', error);
    return NextResponse.json(
      { error: '生成验证码失败' },
      { status: 500 }
    );
  }
}
