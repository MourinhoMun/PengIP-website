import { NextRequest } from 'next/server';
import prisma from '@/app/lib/db';

const SYSTEM_PROMPT_TEMPLATE = `你是鹏哥工具箱的在线客服助手，专为医生IP打造。你的职责是帮助用户了解平台工具、积分体系和会员服务。

网站信息：
- 网站：pengip.com
- 定位：医生IP的AI工具包
- 工具包括：xhs-doctor（医生海报科普图文）、prevsim（术前模拟）、healvision（AI患者康复历程）、starface（我的明星脸）、motionx（AI肖像动态化）
- 积分体系：注册送100积分，各工具消耗不同积分
- 终身会员：¥5000，永久使用权+1000积分
- 联系微信：peng_ip

FAQ知识库：
{faqs}

回答规则：
1. 用中文回答，简洁友好
2. 如果问题超出你的知识范围，说"这个问题我暂时无法回答，建议加微信 peng_ip 咨询鹏哥本人"
3. 不要编造信息`;

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json();

    if (!sessionId || !message) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 获取或创建会话
    let session = await prisma.chatSession.findUnique({ where: { sessionId } });
    if (!session) {
      session = await prisma.chatSession.create({ data: { sessionId } });
    }

    // 保存用户消息
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: message },
    });

    // 获取历史消息（最近10条）
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // 获取 FAQ 构建 system prompt
    const faqs = await prisma.fAQ.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }],
    });
    const faqText = faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{faqs}', faqText || '暂无FAQ数据');

    // 构建消息历史（排除最后一条用户消息，因为它已在history中）
    const messages = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 调用 Claude API（流式）
    const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

    const claudeResponse = await fetch(`${anthropicBaseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!claudeResponse.ok || !claudeResponse.body) {
      const errText = await claudeResponse.text();
      console.error('Claude API error:', errText);
      return new Response(JSON.stringify({ error: 'AI服务暂时不可用，请加微信 peng_ip 联系客服' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 透传流式响应，同时收集完整回复用于存库
    let fullContent = '';
    const reader = claudeResponse.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    fullContent += parsed.delta.text;
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                  } else if (parsed.type === 'message_stop') {
                    controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
                  }
                } catch {
                  // ignore parse errors for non-JSON lines
                }
              }
            }
          }
        } finally {
          controller.close();
          // 保存 assistant 回复到数据库
          if (fullContent) {
            await prisma.chatMessage.create({
              data: { sessionId: session!.id, role: 'assistant', content: fullContent },
            }).catch(console.error);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat message error:', error);
    return new Response(JSON.stringify({ error: '服务异常，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
