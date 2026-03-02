'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, User, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import styles from '../admin.module.scss';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  sessionId: string;
  createdAt: string;
  messages: ChatMessage[];
}

export default function ChatSessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/chat/sessions')
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>客服对话记录</h1>
        <p>查看所有用户与 AI 客服的历史对话，共 {sessions.length} 个会话</p>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div className={styles.spinner} />
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>暂无对话记录</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map((session) => {
              const expanded = expandedId === session.id;
              const lastMsg = session.messages[session.messages.length - 1];
              const userMsgCount = session.messages.filter((m) => m.role === 'user').length;
              return (
                <div key={session.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Session header */}
                  <button
                    onClick={() => toggle(session.id)}
                    style={{
                      width: '100%', background: expanded ? '#f8fafc' : '#fff',
                      border: 'none', padding: '0.9rem 1rem',
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <MessageCircle size={16} style={{ color: '#667eea', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {session.sessionId}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(session.createdAt).toLocaleString('zh-CN')} · {userMsgCount} 条消息
                        {lastMsg && (
                          <span style={{ marginLeft: '0.5rem', color: '#475569' }}>
                            · 最后：{lastMsg.content.slice(0, 30)}{lastMsg.content.length > 30 ? '...' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {expanded ? <ChevronDown size={14} style={{ color: '#94a3b8' }} /> : <ChevronRight size={14} style={{ color: '#94a3b8' }} />}
                  </button>

                  {/* Messages */}
                  {expanded && (
                    <div style={{ padding: '0.75rem 1rem', background: '#f8f9fc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '400px', overflowY: 'auto' }}>
                      {session.messages.map((msg) => (
                        <div key={msg.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <div style={{ flexShrink: 0, marginTop: '2px' }}>
                            {msg.role === 'user'
                              ? <User size={14} style={{ color: '#667eea' }} />
                              : <Bot size={14} style={{ color: '#22c55e' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>
                              {msg.role === 'user' ? '用户' : 'AI 客服'} · {new Date(msg.createdAt).toLocaleTimeString('zh-CN')}
                            </div>
                            <div style={{
                              background: msg.role === 'user' ? '#ede9fe' : '#fff',
                              border: '1px solid ' + (msg.role === 'user' ? '#c4b5fd' : '#e2e8f0'),
                              borderRadius: '8px', padding: '0.5rem 0.75rem',
                              fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            }}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
