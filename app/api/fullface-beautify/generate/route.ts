import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

export const runtime = 'nodejs';

const COST_1K = 10;
const COST_2K = 15;

const TOOL_NAME_EN = 'fullface-beautify';

type Resolution = '1k' | '2k';

const PARTS: Record<string, { label: string; instruction: string }> = {
  nose_synthesis: {
    label: '鼻综合（鼻尖/鼻梁/鼻翼整体协调）',
    instruction: '鼻梁/鼻尖/鼻翼整体更协调、更精致、更立体，但必须自然真实不过度夸张。',
  },
  alar_reduction: {
    label: '鼻翼缩小（鼻翼/鼻孔更精致）',
    instruction: '鼻翼更收拢、鼻孔形态更秀气；保持自然比例与真实光影。',
  },
  eye_comprehensive: {
    label: '双眼皮/眼综合（上睑更精神）',
    instruction: '上眼睑形态更精神自然（双眼皮/眼综合取向），但不夸张、不网红款；保持同一个人的眼型身份特征。',
  },
  eye_bags: {
    label: '去眼袋/泪沟改善（下睑年轻化）',
    instruction: '轻度改善眼袋/泪沟/黑眼圈与疲惫感，但必须保留真实质感，避免把眼周变成假皮肤。',
  },
  midface_filler: {
    label: '中面填充/法令纹改善（玻尿酸/脂肪取向）',
    instruction: '面中更饱满协调、法令纹更淡但自然；不要出现夸张膨胀或面部变形。',
  },
  botox: {
    label: '瘦脸/除皱肉毒（动态纹更淡）',
    instruction: '轮廓更利落、动态纹更淡，但表情必须自然不过僵硬；不要改变整体脸型身份。',
  },
  contour_lift: {
    label: '下颌缘清晰/轮廓提升（不改身份）',
    instruction: '下颌缘更清晰、整体更紧致年轻，但克制自然；不做网红脸，不重塑整张脸。',
  },
  chin_aug: {
    label: '隆下巴（更立体但克制）',
    instruction: '下巴更立体协调但克制自然；不要夸张兜翘或明显改变脸型身份。',
  },
  lip: {
    label: '丰唇/唇形调整（自然，不夸张）',
    instruction: '唇形与唇色更协调自然；不要夸张丰唇或强烈医美感。',
  },
  skin: {
    label: '皮肤综合（更细腻但不磨皮）',
    instruction: '肤质更细腻干净、瑕疵更少，但必须保留真实皮肤纹理与毛孔；禁止过度磨皮或塑料感。',
  },
};

const NEGATIVE_PROMPT = [
  '过度磨皮',
  '塑料感皮肤',
  '网红脸',
  '夸张大眼',
  '夸张丰唇',
  '整张脸重塑',
  '改变年龄',
  '改变性别',
  '换脸',
  '动漫风',
  '美颜滤镜',
  '强HDR',
  '过度锐化',
  '假皮肤',
  '牙齿过白',
  '烤瓷牙',
].join(', ');

function getEnvOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`MISSING_ENV:${name}`);
  return v;
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = String(dataUrl || '').match(/^data:(.+);base64,(.+)$/);
  if (!m) throw new Error('INVALID_IMAGE');
  return { mimeType: m[1], data: m[2] };
}

function buildPrompt(selectedKeys: string[]): string {
  const selected = selectedKeys
    .map((k) => PARTS[k])
    .filter(Boolean);

  const labels = selected.map((s) => s.label).join('、') || '整体自然变美';
  const instructions = selected.map((s) => `- ${s.instruction}`).join('\n');

  return [
    '你是专业的人像美学修图导演。任务：在不改变身份的前提下，让照片里的同一个人自然变美。',
    '硬性要求：必须是同一个人；保持年龄/性别/肤色/发型/表情/角度/光线/背景不变；不要网红脸；不要过度磨皮。',
    `需要重点优化的项目类型：${labels}。`,
    instructions ? `具体要求：\n${instructions}` : '',
    '输出：写实手机摄影风格，真实质感，单张结果图。',
  ]
    .filter(Boolean)
    .join('\n');
}

function extractImageDataUrlFromGemini(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    const inline = p?.inlineData || p?.inline_data;
    if (inline?.data) {
      const mt = inline?.mimeType || inline?.mime_type || 'image/png';
      return `data:${mt};base64,${inline.data}`;
    }
    if (p?.text) {
      const u = String(p.text).match(/https?:\/\/[^\s)]+/);
      if (u) return u[0];
    }
  }
  throw new Error('NO_IMAGE');
}

async function refundPoints(userId: string, toolId: string | null, amount: number, reason: string) {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { points: { increment: amount } } });
    await tx.pointTransaction.create({
      data: {
        userId,
        amount,
        type: 'refund',
        description: reason,
        relatedId: toolId || undefined,
      },
    });
  });
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let toolId: string | null = null;
  let cost = 0;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '请先登录', needLogin: true }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const imageDataUrl = String(body?.imageDataUrl || '');
    const parts = Array.isArray(body?.parts) ? body.parts.map(String) : [];
    const resolution = (String(body?.resolution || '1k') as Resolution);

    if (!imageDataUrl) {
      return NextResponse.json({ error: '请先上传一张术前照片' }, { status: 400 });
    }

    const selectedKeys = parts.filter((k: string) => Object.prototype.hasOwnProperty.call(PARTS, k));
    if (selectedKeys.length === 0) {
      return NextResponse.json({ error: '请至少选择 1 个需要优化的部位' }, { status: 400 });
    }

    const { mimeType, data } = parseDataUrl(imageDataUrl);

    cost = resolution === '2k' ? COST_2K : COST_1K;

    const tool = await prisma.tool.findFirst({
      where: { nameEn: TOOL_NAME_EN, status: 'active' },
      select: { id: true, name: true },
    });
    if (!tool) {
      return NextResponse.json({ error: '工具未配置（缺少 Tool 记录）' }, { status: 500 });
    }
    toolId = tool.id;

    const user = await prisma.user.findUnique({ where: { id: currentUser.userId } });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    userId = user.id;

    const now = new Date();
    if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt < now) {
      return NextResponse.json({ error: '请先激活年卡', subscriptionRequired: true }, { status: 403 });
    }

    if (user.points < cost) {
      return NextResponse.json({ error: `积分不足：本次需要 ${cost} 积分` }, { status: 400 });
    }

    // Pre-deduct points before calling provider.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { points: { decrement: cost } } });
      await tx.toolUsage.create({ data: { userId: user.id, toolId: tool.id, points: cost } });
      await tx.pointTransaction.create({
        data: {
          userId: user.id,
          amount: -cost,
          type: 'use_tool',
          description: `Use tool: ${tool.name} (${resolution.toUpperCase()})`,
          relatedId: tool.id,
        },
      });
    });

    const base = process.env.YUNWU_BASE_URL || 'https://yunwu.ai';
    const key = getEnvOrThrow('YUNWU_API_KEY');

    const prompt = buildPrompt(selectedKeys);

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data } },
          ],
        },
      ],
      generationConfig: {
        aspectRatio: '3:4',
        negativePrompt: NEGATIVE_PROMPT,
      },
    };

    const r = await fetch(`${base}/v1beta/models/gemini-3.1-flash-image-preview:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    const dataResp = await r.json().catch(() => null);
    if (!r.ok) {
      const msg = dataResp?.error?.message || dataResp?.error || '生成失败';
      throw new Error(`PROVIDER_ERROR:${msg}`);
    }

    const out = extractImageDataUrlFromGemini(dataResp);
    const remaining = await prisma.user.findUnique({ where: { id: user.id }, select: { points: true } });

    return NextResponse.json({
      success: true,
      imageDataUrl: out,
      cost,
      remaining_points: remaining?.points ?? null,
    });
  } catch (e: any) {
    const msg = e?.message || '生成失败';

    // Best-effort refund if points were deducted.
    if (userId && cost > 0) {
      try {
        await refundPoints(userId, toolId, cost, `Refund: ${msg}`);
      } catch {
        // ignore refund errors
      }
    }

    if (String(msg).startsWith('MISSING_ENV:')) {
      return NextResponse.json({ error: '服务器未配置图片生成服务（缺少 YUNWU_API_KEY）' }, { status: 500 });
    }

    if (msg === 'INVALID_IMAGE') {
      return NextResponse.json({ error: '图片格式不正确，请重新上传' }, { status: 400 });
    }

    if (msg === 'NO_IMAGE') {
      return NextResponse.json({ error: '生成成功但未返回图片，请重试' }, { status: 502 });
    }

    return NextResponse.json({ error: msg.replace(/^PROVIDER_ERROR:/, '') }, { status: 500 });
  }
}
