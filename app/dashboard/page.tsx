'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n';
import { Coins, Gift, Copy, Check, ExternalLink, History, LogOut, ArrowLeft, Sparkles, Download, Key } from 'lucide-react';
import styles from './dashboard.module.scss';

interface Tool {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  descriptionEn: string | null;
  icon: string | null;
  points: number;
  url: string | null;
  downloadUrl: string | null;
  status: string;
}

interface PointTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface Activation {
  id: string;
  tool: { id: string; name: string; nameEn: string | null; icon: string | null; downloadUrl: string | null };
  usedAt: string;
}

export default function DashboardPage() {
  const { user, loading, refreshUser, logout } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usingTool, setUsingTool] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activateCode, setActivateCode] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchTools();
      fetchActivations();
    }
  }, [user]);

  const fetchTools = async () => {
    try {
      const res = await fetch('/api/tools');
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools);
      }
    } catch { /* ignore */ }
  };

  const fetchActivations = async () => {
    try {
      const res = await fetch('/api/tools/activate');
      if (res.ok) {
        const data = await res.json();
        setActivations(data.activations || []);
      }
    } catch { /* ignore */ }
  };

  const handleActivate = async () => {
    if (!activateCode.trim()) {
      setMessage({ type: 'error', text: '请输入激活码' });
      return;
    }
    setActivating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/tools/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activateCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || '激活成功！' });
        setActivateCode('');
        fetchActivations();
      } else {
        setMessage({ type: 'error', text: data.error || '激活失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setActivating(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/points');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch { /* ignore */ }
  };

  const handleUseTool = async (tool: Tool) => {
    if (!user) return;
    if (user.points < tool.points) {
      setMessage({ type: 'error', text: `积分不足！需要 ${tool.points} 积分，当前 ${user.points} 积分` });
      return;
    }

    setUsingTool(tool.id);
    setMessage(null);

    try {
      const res = await fetch('/api/tools/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `已使用「${tool.name}」，消耗 ${tool.points} 积分` });
        await refreshUser();
        if (data.toolUrl) {
          window.location.href = data.toolUrl;
        }
      } else {
        setMessage({ type: 'error', text: data.error || '使用失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setUsingTool(null);
    }
  };

  const copyInviteCode = () => {
    if (user?.inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/register?invite=${user.inviteCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShowHistory = () => {
    if (!showHistory) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      register: '注册奖励',
      invite: '邀请奖励',
      use_tool: '使用工具',
      recharge: '充值',
      admin_adjust: '管理员调整',
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>加载中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.dashboardPage}>
      {/* 顶部导航 */}
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>{lang === 'zh' ? '返回首页' : 'Home'}</span>
        </Link>
        <div className={styles.headerRight}>
          {user.role === 'admin' && (
            <Link href="/admin" className={styles.adminLink}>
              {lang === 'zh' ? '管理后台' : 'Admin'}
            </Link>
          )}
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} />
            <span>{lang === 'zh' ? '退出' : 'Logout'}</span>
          </button>
        </div>
      </header>

      <div className={styles.container}>
        {/* 用户信息卡 */}
        <section className={styles.profileCard}>
          <div className={styles.profileAvatar}>
            {(user.name || user.email || user.phone || '用户')[0].toUpperCase()}
          </div>
          <div className={styles.profileInfo}>
            <h1>{user.name || user.email || user.phone || '用户'}</h1>
            <p className={styles.profileSub}>
              {user.email && <span>{user.email}</span>}
              {user.phone && <span>{user.phone}</span>}
            </p>
          </div>
          <div className={styles.pointsBadge}>
            <Coins size={20} />
            <span className={styles.pointsNumber}>{user.points}</span>
            <span className={styles.pointsLabel}>{lang === 'zh' ? '积分' : 'Points'}</span>
          </div>
        </section>

        {/* 快捷操作 */}
        <section className={styles.quickActions}>
          <button onClick={copyInviteCode} className={styles.actionBtn}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? '已复制' : (lang === 'zh' ? '复制邀请链接' : 'Copy Invite Link')}</span>
          </button>
          <button onClick={handleShowHistory} className={styles.actionBtn}>
            <History size={16} />
            <span>{showHistory ? (lang === 'zh' ? '隐藏记录' : 'Hide') : (lang === 'zh' ? '积分记录' : 'History')}</span>
          </button>
          <div className={styles.inviteTip}>
            <Gift size={14} />
            <span>{lang === 'zh' ? '邀请好友注册，双方各得50积分' : 'Invite friends, both earn 50 pts'}</span>
          </div>
        </section>

        {/* 积分记录 */}
        {showHistory && (
          <section className={styles.historySection}>
            <h2>{lang === 'zh' ? '积分记录' : 'Points History'}</h2>
            {transactions.length === 0 ? (
              <p className={styles.emptyText}>{lang === 'zh' ? '暂无记录' : 'No records'}</p>
            ) : (
              <div className={styles.historyList}>
                {transactions.map((tx) => (
                  <div key={tx.id} className={styles.historyItem}>
                    <div className={styles.historyLeft}>
                      <span className={styles.historyType}>{getTypeLabel(tx.type)}</span>
                      {tx.description && <span className={styles.historyDesc}>{tx.description}</span>}
                    </div>
                    <div className={styles.historyRight}>
                      <span className={`${styles.historyAmount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                      <span className={styles.historyDate}>
                        {new Date(tx.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 提示消息 */}
        {message && (
          <div className={`${styles.toast} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {/* 激活码区域 */}
        <section className={styles.activateSection}>
          <div className={styles.toolsHeader}>
            <Key size={22} />
            <h2>{lang === 'zh' ? '激活工具' : 'Activate Tool'}</h2>
          </div>
          <p className={styles.toolsDesc}>
            {lang === 'zh' ? '输入激活码，解锁对应工具的下载和使用权限' : 'Enter activation code to unlock tool download'}
          </p>
          <div className={styles.activateRow}>
            <input
              type="text"
              value={activateCode}
              onChange={(e) => setActivateCode(e.target.value.toUpperCase())}
              placeholder={lang === 'zh' ? '请输入激活码，如 XXXX-XXXX-XXXX-XXXX' : 'Enter code like XXXX-XXXX-XXXX-XXXX'}
              className={styles.activateInput}
              onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
            />
            <button
              onClick={handleActivate}
              disabled={activating}
              className={styles.activateBtn}
            >
              {activating ? '...' : (lang === 'zh' ? '激活' : 'Activate')}
            </button>
          </div>

          {/* 已激活工具列表 */}
          {activations.length > 0 && (
            <div className={styles.activatedList}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                {lang === 'zh' ? '已激活工具' : 'Activated Tools'}
              </h3>
              {activations.map((a) => (
                <div key={a.id} className={styles.activatedItem}>
                  <span className={styles.activatedIcon}>{a.tool.icon || '🔧'}</span>
                  <span className={styles.activatedName}>
                    {lang === 'en' && a.tool.nameEn ? a.tool.nameEn : a.tool.name}
                  </span>
                  {a.tool.downloadUrl && (
                    <a
                      href={a.tool.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.downloadBtn}
                    >
                      <Download size={14} />
                      {lang === 'zh' ? '下载' : 'Download'}
                    </a>
                  )}
                  <span className={styles.activatedDate}>
                    {a.usedAt ? new Date(a.usedAt).toLocaleDateString('zh-CN') : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 工具列表 */}
        <section className={styles.toolsSection}>
          <div className={styles.toolsHeader}>
            <Sparkles size={22} />
            <h2>{lang === 'zh' ? 'AI 工具' : 'AI Tools'}</h2>
          </div>
          <p className={styles.toolsDesc}>
            {lang === 'zh' ? '点击「开始使用」，消耗积分即可体验对应AI工具' : 'Click to use tools, each costs some points'}
          </p>

          <div className={styles.toolsGrid}>
            {tools.map((tool) => {
              const isUsing = usingTool === tool.id;
              const canAfford = user.points >= tool.points;
              const isComing = tool.status === 'coming';
              const isActivated = activations.some(a => a.tool.id === tool.id);

              return (
                <div key={tool.id} className={`${styles.toolCard} ${isComing ? styles.coming : ''}`}>
                  <div className={styles.toolIcon}>{tool.icon || '🔧'}</div>
                  <div className={styles.toolInfo}>
                    <h3>{lang === 'en' && tool.nameEn ? tool.nameEn : tool.name}</h3>
                    <p>{lang === 'en' && tool.descriptionEn ? tool.descriptionEn : tool.description}</p>
                  </div>
                  <div className={styles.toolFooter}>
                    <span className={styles.toolCost}>
                      <Coins size={14} />
                      {isActivated ? (lang === 'zh' ? '已激活' : 'Activated') : `${tool.points} ${lang === 'zh' ? '积分' : 'pts'}`}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {tool.downloadUrl && isActivated && (
                        <a
                          href={tool.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.downloadSmBtn}
                          title={lang === 'zh' ? '下载' : 'Download'}
                        >
                          <Download size={14} />
                        </a>
                      )}
                      {isComing ? (
                        <span className={styles.comingBadge}>{lang === 'zh' ? '即将上线' : 'Coming'}</span>
                      ) : isActivated && tool.url ? (
                        <a href={tool.url} className={styles.useBtn}>
                          <ExternalLink size={14} />
                          {lang === 'zh' ? '进入工具' : 'Open'}
                        </a>
                      ) : (
                        <button
                          className={`${styles.useBtn} ${!canAfford ? styles.disabled : ''}`}
                          onClick={() => handleUseTool(tool)}
                          disabled={isUsing || !canAfford}
                        >
                          {isUsing ? (
                            <span className={styles.btnSpinner} />
                          ) : (
                            <>
                              <ExternalLink size={14} />
                              {canAfford
                                ? (lang === 'zh' ? '开始使用' : 'Use')
                                : (lang === 'zh' ? '积分不足' : 'Need pts')
                              }
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {tools.length === 0 && (
            <div className={styles.emptyTools}>
              <p>{lang === 'zh' ? '暂无可用工具，请稍后再来' : 'No tools available yet'}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
