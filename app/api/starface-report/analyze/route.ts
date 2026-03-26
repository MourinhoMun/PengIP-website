import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/auth';

export const runtime = 'nodejs';

const TOOL_NAME_EN = 'lookalike-report';
const DEFAULT_TOP_N = 3;
const MAX_TOP_N = 5;

type FaceProfileSection = {
  title: string;
  items: string[];
};

type ImageRef = {
  thumbUrl: string;
  sourceUrl: string;
  sourceDomain: string;
};

type Match = {
  name: string;
  similarityPercent: number;
  reasons: string[];
  images?: ImageRef[];
};

type Report = {
  summary: string;
  faceProfile: FaceProfileSection[];
  matches: Match[];
};

function getEnvOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`MISSING_ENV:${name}`);
  return v;
}

function clampInt(v: any, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function sleepMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = String(dataUrl || '').match(/^data:(.+);base64,(.+)$/);
  if (!m) throw new Error('INVALID_IMAGE');
  return { mimeType: m[1], data: m[2] };
}

function extractTextFromGemini(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const chunks: string[] = [];
  for (const p of parts) {
    if (p?.text) chunks.push(String(p.text));
  }
  return chunks.join('\n').trim();
}

function safeParseJsonFromText(text: string): any {
  const s = String(text || '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('BAD_MODEL_OUTPUT');
  const jsonStr = s.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('BAD_MODEL_OUTPUT');
  }
}

function normalizeReport(raw: any, topN: number): Report {
  const summary = String(raw?.summary || '').trim();
  const faceProfileRaw = Array.isArray(raw?.faceProfile) ? raw.faceProfile : [];
  const matchesRaw = Array.isArray(raw?.matches) ? raw.matches : [];

  const faceProfile: FaceProfileSection[] = faceProfileRaw
    .map((s: any) => ({
      title: String(s?.title || '').trim(),
      items: (Array.isArray(s?.items) ? s.items : []).map((x: any) => String(x || '').trim()).filter(Boolean),
    }))
    .filter((s: FaceProfileSection) => s.title && s.items.length > 0)
    .slice(0, 8);

  const matches: Match[] = matchesRaw
    .map((m: any) => ({
      name: String(m?.name || '').trim(),
      similarityPercent: clampInt(m?.similarityPercent, 1, 99, 60),
      reasons: (Array.isArray(m?.reasons) ? m.reasons : []).map((x: any) => String(x || '').trim()).filter(Boolean),
    }))
    .filter((m: Match) => m.name)
    .slice(0, topN);

  if (!summary || faceProfile.length === 0 || matches.length === 0) {
    throw new Error('BAD_MODEL_OUTPUT');
  }

  // Safety: keep output in a reasonable marketing-friendly range to reduce disputes.
  for (const m of matches) {
    m.similarityPercent = Math.min(88, Math.max(55, m.similarityPercent));
    m.reasons = m.reasons.slice(0, 6);
  }

  return { summary, faceProfile, matches };
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

function isLikelyImageUrl(url: string): boolean {
  const u = String(url || '').toLowerCase();
  return u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.png') || u.endsWith('.webp') || u.endsWith('.gif');
}

async function fetchCommonsImages(name: string, limit: number): Promise<ImageRef[]> {
  const base = 'https://commons.wikimedia.org/w/api.php';

  const searchParams = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: name,
    srnamespace: '6',
    srlimit: String(Math.max(1, Math.min(12, limit))),
    format: 'json',
    origin: '*',
  });

  const r1 = await fetch(`${base}?${searchParams.toString()}`);
  const j1 = await r1.json().catch(() => null);
  const titles: string[] = (j1?.query?.search || [])
    .map((x: any) => String(x?.title || '').trim())
    .filter(Boolean);

  if (titles.length === 0) return [];

  const iiParams = new URLSearchParams({
    action: 'query',
    prop: 'imageinfo',
    titles: titles.slice(0, limit).join('|'),
    iiprop: 'url',
    iiurlwidth: '480',
    format: 'json',
    origin: '*',
  });

  const r2 = await fetch(`${base}?${iiParams.toString()}`);
  const j2 = await r2.json().catch(() => null);
  const pages = j2?.query?.pages || {};

  const out: ImageRef[] = [];
  for (const pageId of Object.keys(pages)) {
    const p = pages[pageId];
    const title = String(p?.title || '').trim();
    const info = Array.isArray(p?.imageinfo) ? p.imageinfo[0] : null;
    const thumbUrl = String(info?.thumburl || info?.url || '').trim();
    if (!thumbUrl || !isLikelyImageUrl(thumbUrl)) continue;

    const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
    out.push({ thumbUrl, sourceUrl, sourceDomain: 'commons.wikimedia.org' });
    if (out.length >= limit) break;
  }

  // De-dup by thumbUrl.
  return Array.from(new Map(out.map((x) => [x.thumbUrl, x])).values());
}

function buildPrompt(topN: number): string {
  return [
    '你是专业面部美学分析师。任务：基于用户提供的正面人像照片，输出一份“相似明星分析报告”。',
    '强约束：这是娱乐与内容创作参考，不做身份识别；不要猜测用户真实身份；不要输出敏感推断（例如种族、宗教、健康状况、政治等）。',
    `请给出 ${topN} 位相似明星（中日韩/港台/欧美均可，尽量选择公众熟知且有公开照片的明星）。`,
    '每位明星输出 similarityPercent（55~88 的整数，展示为百分比即可，避免夸张到 90+）。',
    '每位明星给出 reasons（3~5条），每条必须绑定具体部位或特征（脸型/轮廓/眉眼/鼻/唇/立体度/气质），避免空话。',
    'faceProfile 输出 4~7 个小节，每节包含 title 与 items（2~4条）。',
    'summary 输出 1~2 句结论型中文。',
    '只输出严格 JSON，不要 Markdown，不要额外文字。JSON 结构如下：',
    '{',
    '  "summary": "...",',
    '  "faceProfile": [',
    '    {"title": "脸型与轮廓", "items": ["...", "..."]}',
    '  ],',
    '  "matches": [',
    '    {"name": "明星名", "similarityPercent": 78, "reasons": ["...", "..."]}',
    '  ]',
    '}',
  ].join('\n');
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
    const topN = clampInt(body?.topN, 2, MAX_TOP_N, DEFAULT_TOP_N);

    if (!imageDataUrl) {
      return NextResponse.json({ error: '请先上传一张正脸照片' }, { status: 400 });
    }

    // Basic size guard: ~8MB base64 payload.
    if (imageDataUrl.length > 12_000_000) {
      return NextResponse.json({ error: '图片过大，请换一张更小的照片（建议 10MB 以内）' }, { status: 400 });
    }

    const { mimeType, data } = parseDataUrl(imageDataUrl);

    const tool = await prisma.tool.findFirst({
      where: { nameEn: TOOL_NAME_EN, status: 'active' },
      // points is the billing source of truth
      select: { id: true, name: true, points: true },
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

    cost = tool.points;
    if (cost <= 0) {
      return NextResponse.json({ error: '工具计费未配置（points 必须大于 0）' }, { status: 500 });
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
          description: `Use tool: ${tool.name}`,
          relatedId: tool.id,
        },
      });
    });

    const base = process.env.YUNWU_BASE_URL || 'https://yunwu.ai';
    const key = getEnvOrThrow('YUNWU_API_KEY');

    const prompt = buildPrompt(topN);

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
        temperature: 0.5,
        maxOutputTokens: 1200,
      },
    };

    const configuredModel = process.env.STARFACE_TEXT_MODEL;
    const modelCandidates = Array.from(
      new Set(
        [
          configuredModel,
          // Yunwu sometimes has channels for the image-preview variant even when the plain model is unavailable.
          'gemini-3.1-flash-image-preview',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
        ].filter(Boolean)
      )
    ) as string[];

    let okResp: any = null;
    let lastProviderMsg: string | null = null;

    outer: for (const model of modelCandidates) {
      const maxAttempts = 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let r: Response;
        try {
          r = await fetch(`${base}/v1beta/models/${model}:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(180_000),
          });
        } catch (err: any) {
          lastProviderMsg = String(err?.message || err || 'fetch failed');
          if (attempt < maxAttempts) {
            await sleepMs(800 * attempt);
            continue;
          }
          // Network failure: try next model.
          break;
        }

        const dataResp = await r.json().catch(() => null);
        if (!r.ok) {
          const msg = dataResp?.error?.message || dataResp?.error || `HTTP ${r.status}`;
          lastProviderMsg = String(msg);

          const retryable = r.status === 429 || r.status === 500 || r.status === 502 || r.status === 503;
          if (retryable && attempt < maxAttempts) {
            await sleepMs(800 * attempt);
            continue;
          }

          const noChannel = lastProviderMsg.includes('无可用渠道') || lastProviderMsg.toLowerCase().includes('no available') || lastProviderMsg.toLowerCase().includes('distributor');
          if (noChannel) {
            // Model/channel unavailable: try next model candidate.
            break;
          }

          throw new Error(`PROVIDER_ERROR:${lastProviderMsg}`);
        }

        okResp = dataResp;
        break outer;
      }
    }

    if (!okResp) {
      throw new Error(`PROVIDER_ERROR:${lastProviderMsg || '分析失败'}`);
    }

    const text = extractTextFromGemini(okResp);
    const raw = safeParseJsonFromText(text);
    const report = normalizeReport(raw, topN);

    // Best-effort: enrich with a few public reference images from Wikimedia Commons.
    await Promise.all(
      report.matches.map(async (m) => {
        try {
          m.images = await fetchCommonsImages(m.name, 6);
        } catch {
          m.images = [];
        }
      })
    );

    const remaining = await prisma.user.findUnique({ where: { id: user.id }, select: { points: true } });

    return NextResponse.json({
      success: true,
      report,
      cost,
      remaining_points: remaining?.points ?? null,
    });
  } catch (e: any) {
    const msg = e?.message || '分析失败';

    // Best-effort refund if points were deducted.
    if (userId && cost > 0) {
      try {
        await refundPoints(userId, toolId, cost, `Refund: ${msg}`);
      } catch {
        // ignore refund errors
      }
    }

    if (String(msg).startsWith('MISSING_ENV:')) {
      return NextResponse.json({ error: '服务器未配置分析服务（缺少 YUNWU_API_KEY）' }, { status: 500 });
    }

    if (msg === 'INVALID_IMAGE') {
      return NextResponse.json({ error: '图片格式不正确，请重新上传' }, { status: 400 });
    }

    if (msg === 'BAD_MODEL_OUTPUT') {
      return NextResponse.json({ error: 'AI 返回内容不稳定，请换一张更清晰的正面照再试一次' }, { status: 502 });
    }

    return NextResponse.json({ error: msg.replace(/^PROVIDER_ERROR:/, '') }, { status: 500 });
  }
}
