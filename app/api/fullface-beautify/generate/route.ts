import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

export const runtime = 'nodejs';

const COST_1K = 10;
const COST_2K = 15;

const TOOL_NAME_EN = 'fullface-beautify';

type Resolution = '1k' | '2k';

const PARTS: Record<string, { label: string; instruction: string }> = {
  skin: {
    label: '皮肤质感',
    instruction: '减少痘印与瑕疵，但保留真实皮肤纹理与毛孔；禁止过度磨皮或塑料感。',
  },
  eyes: {
    label: '眼睛（神采）',
    instruction: '让眼神更有精神、更清澈自然；不夸张放大、不改变眼型与身份特征。',
  },
  underEye: {
    label: '眼袋/泪沟/黑眼圈',
    instruction: '轻度改善眼袋、泪沟、黑眼圈与浮肿，但必须自然真实，不要“熨平”成假皮肤。',
  },
  brows: {
    label: '眉形/眉色',
    instruction: '眉形更利落协调，眉色更自然均匀；保持原眉毛走向与个人气质，不要纹眉感。',
  },
  nose: {
    label: '鼻子',
    instruction: '轻度提升鼻部立体感（鼻梁/鼻尖/鼻翼更精致），保持自然真实比例。',
  },
  lips: {
    label: '嘴唇',
    instruction: '轻度优化唇形与唇色，保持自然，不做夸张丰唇。',
  },
  teeth: {
    label: '牙齿/笑容',
    instruction: '如果牙齿可见：轻度更干净明亮，但不要过白；保持牙齿形态，不做夸张整齐“烤瓷牙”。',
  },
  cheeks: {
    label: '面颊/苹果肌',
    instruction: '面中更饱满协调，轻度淡化法令纹；保持自然光影与真实质感。',
  },
  jawline: {
    label: '下颌缘/下巴',
    instruction: '下颌线更清晰、下巴更立体但克制；保持原脸型与个人特征。',
  },
  forehead: {
    label: '额头',
    instruction: '额头更饱满平整但自然，不改变发际线与头发细节。',
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
    `需要重点优化的部位：${labels}。`,
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
