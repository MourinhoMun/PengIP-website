'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import styles from './chat.module.scss';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const SESSION_KEY = 'pengip_chat_session';
const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '你好！我是鹏哥工具箱的在线客服，有什么可以帮到你的吗？😊\n\n如需人工服务，可以加微信 **peng_ip** 联系鹏哥本人。',
};

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    // 添加 assistant 占位消息（流式）
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch('/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message: text }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        setMessages((prev) => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = {
            role: 'assistant',
            content: errData.error || '服务暂时不可用，建议加微信 peng_ip 联系客服。',
          };
          return msgs;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages((prev) => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, content: last.content + parsed.text };
                return msgs;
              });
            }
          } catch {
            // ignore
          }
        }
      }

      // 停止 streaming 动画
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], streaming: false };
        return msgs;
      });
    } catch {
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          role: 'assistant',
          content: '网络异常，请稍后重试或加微信 peng_ip 联系客服。',
          streaming: false,
        };
        return msgs;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.chatWidget}>
      {open && (
        <div className={styles.chatBox}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div>
              <h3>鹏哥客服</h3>
              <p>在线 · 随时为你解答</p>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="关闭">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}>
                <div className={styles.bubble}>
                  {msg.content}
                  {msg.streaming && <span className={styles.cursor} />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Enter 发送..."
              rows={1}
              disabled={loading}
            />
            <button className={styles.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()} aria-label="发送">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <div className={styles.toggleBtnWrap}>
        <button className={styles.toggleBtn} onClick={() => setOpen((v) => !v)} aria-label="打开客服">
          {open ? <X size={22} /> : <span style={{ fontSize: 22 }}>💬</span>}
        </button>
        {!open && <span className={styles.badge} />}
      </div>
    </div>
  );
}
