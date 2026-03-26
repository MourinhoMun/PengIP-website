'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n';
import { Coins, Gift, Copy, Check, ExternalLink, History, LogOut, ArrowLeft, Sparkles, Download, Key, Crown, X, BookOpen } from 'lucide-react';
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
  tutorialUrl: string | null;
  tutorialContent: string | null;
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
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [rechargeCode, setRechargeCode] = useState('');
  const [recharging, setRecharging] = useState(false);

  // 条款确认弹窗（版本号变更时强制重新确认）
  const TERMS_VERSION = 'v2';
  const [showTerms, setShowTerms] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const accepted = localStorage.getItem('pengip_terms_accepted');
      if (accepted !== TERMS_VERSION) {
        setShowTerms(true);
      }
    }
  }, [user]);

  const handleAcceptTerms = () => {
    localStorage.setItem('pengip_terms_accepted', TERMS_VERSION);
    setShowTerms(false);
  };

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
        await refreshUser();
      } else {
        setMessage({ type: 'error', text: data.error || '激活失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setActivating(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeCode.trim()) {
      setMessage({ type: 'error', text: '请输入积分码' });
      return;
    }
    setRecharging(true);
    setMessage(null);
    try {
      const res = await fetch('/api/tools/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: rechargeCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || '充值成功！' });
        setRechargeCode('');
        await refreshUser();
      } else {
        setMessage({ type: 'error', text: data.error || '充值失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setRecharging(false);
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
      setMessage({ type: 'error', text: `积分不足！需要 ${tool.points} 积分，当前 ${user.points} 积分。请联系鹏哥微信：Peng_IP 购买年卡或者获得7天试用` });
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
        if (data.subscriptionRequired) {
          setShowRenewalModal(true);
        } else {
          setMessage({ type: 'error', text: data.error || '使用失败' });
        }
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

  const isSubscribed = !!(user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date());
  const subscriptionExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;

  return (
    <div className={styles.dashboardPage}>

      {/* ── 条款确认弹窗（全局强制，所有用户必须同意） ── */}
      {showTerms && (
        <div className={styles.termsOverlay}>
          <div className={styles.termsModal}>
            <h2 className={styles.termsTitle}>⚠️ 用户使用协议与免责声明</h2>
            <p className={styles.termsSubtitle}>请仔细阅读以下条款，滚动至底部后方可同意</p>

            <div
              className={styles.termsBody}
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 30) setTermsScrolled(true);
              }}
            >
              <h3>一、平台性质与内容声明</h3>
              <p>PengIP 平台（以下简称"本平台"）提供的所有工具均为<strong>人工智能辅助创作工具</strong>，所有生成内容（包括图像、视频、文字）均为 AI 模拟输出，<strong>不具备任何医疗、法律、专业诊断效力</strong>，不构成任何形式的承诺或保证。</p>

              <h3>二、医疗相关工具专项限制（PreVSim / HealVision）</h3>
              <p>依据《广告法》《医疗广告管理办法》《医疗器械监督管理条例》，使用本平台医疗相关工具时，用户明确知悉并承诺：</p>
              <ul>
                <li><strong>严禁</strong>将 AI 生成图像用于医疗机构任何形式的对外宣传，包括但不限于官网、公众号、短视频、印刷品</li>
                <li><strong>严禁</strong>将模拟图像作为"真实手术案例"或"术前术后对比"向患者或公众展示</li>
                <li><strong>严禁</strong>以 AI 生成内容诱导患者做出任何医疗决策</li>
                <li><strong>严禁</strong>用于任何形式的商业广告、推广或营销活动</li>
                <li>AI 生成结果仅可用于医患沟通参考，使用前须由执业医师向患者说明该图像为 AI 模拟效果</li>
              </ul>
              <p>违反以上限制，可能触犯《广告法》第 58 条等条款，面临<strong>吊销执照、最高 100 万元以上罚款及刑事追责</strong>，本平台不承担任何连带责任。</p>

              <h3>三、肖像权与隐私（StarFace / MotionX / 照片合拍生成器）</h3>
              <p>依据《中华人民共和国民法典》第四编人格权相关条款及《个人信息保护法》：</p>
              <ul>
                <li>上传他人照片前，必须取得该人的<strong>明确书面授权</strong></li>
                <li><strong>严禁</strong>上传未成年人面部照片</li>
                <li><strong>严禁</strong>利用生成内容冒充他人、实施欺诈、诽谤或性骚扰</li>
                <li><strong>严禁</strong>生成、传播涉及真实人物的虚假视频/图像用于误导公众</li>
                <li>生成的包含他人面孔的内容，未经本人授权<strong>不得对外发布或传播</strong></li>
              </ul>

              <h3>四、AI 生成内容合规义务</h3>
              <p>依据《生成式人工智能服务管理暂行办法》（2023年）：</p>
              <ul>
                <li>用户须确保输入内容（提示词、上传图片）不含违法、有害信息</li>
                <li>对外传播 AI 生成内容时，<strong>必须显著标注"AI生成"字样</strong></li>
                <li><strong>严禁</strong>使用 AI 生成内容传播谣言、虚假信息或从事违法活动</li>
              </ul>

              <h3>五、责任限制</h3>
              <p>本平台仅提供技术工具服务，对用户使用生成内容的行为不承担监督义务，但保留配合执法机关调查的权利。<strong>因用户违规使用产生的一切法律责任，由用户本人承担，本平台不承担任何连带责任。</strong></p>
              <p>本平台保留随时修改本协议的权利，修改后将要求用户重新确认。</p>

              <p className={styles.termsVersion}>协议版本：{TERMS_VERSION} · 最后更新：2025年3月</p>
            </div>

            <div className={styles.termsFooter}>
              <label className={styles.termsCheck}>
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={e => setTermsChecked(e.target.checked)}
                  disabled={!termsScrolled}
                />
                <span>我已完整阅读上述条款，理解并同意遵守全部规定</span>
              </label>
              {!termsScrolled && <p className={styles.termsHint}>↓ 请滚动阅读全部条款</p>}
              <button
                className={styles.termsAcceptBtn}
                disabled={!termsChecked || !termsScrolled}
                onClick={handleAcceptTerms}
              >
                同意条款并进入
              </button>
            </div>
          </div>
        </div>
      )}

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
            {isSubscribed && subscriptionExpiry ? (
              <div className={styles.subBadgeActive}>
                <Crown size={11} />
                年卡有效 · 至 {subscriptionExpiry.toLocaleDateString('zh-CN')}
              </div>
            ) : (
              <div className={styles.subBadgeExpired}>
                {subscriptionExpiry ? '年卡已过期' : '未激活年卡'}
              </div>
            )}
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
            <h2>{lang === 'zh' ? '激活年卡' : 'Activate'}</h2>
          </div>
          <p className={styles.toolsDesc}>
            {lang === 'zh' ? '输入年卡/月卡/7天试用激活码，激活后可使用所有工具' : 'Enter annual/monthly/trial code to unlock all tools'}
          </p>
          <div className={styles.activateRow}>
            <input
              type="text"
              value={activateCode}
              onChange={(e) => setActivateCode(e.target.value.toUpperCase())}
              placeholder={lang === 'zh' ? '请输入激活码，如 XXXX-XXXX-XXXX-XXXX' : 'Enter code like XXXX-XXXX-XXXX-XXXX'}
              className={styles.activateInput}
              onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
              id="activateInput"
            />
            <button
              onClick={handleActivate}
              disabled={activating}
              className={styles.activateBtn}
            >
              {activating ? '...' : (lang === 'zh' ? '激活' : 'Activate')}
            </button>
          </div>
        </section>

        {/* 积分充值区域 */}
        <section className={styles.rechargeSection} id="recharge">
          <div className={styles.toolsHeader}>
            <Coins size={22} />
            <h2>{lang === 'zh' ? '充值积分' : 'Recharge Points'}</h2>
          </div>
          <p className={styles.toolsDesc}>
            {lang === 'zh' ? '输入积分码，立即为账户充值积分' : 'Enter recharge code to add points to your account'}
          </p>
          <div className={styles.activateRow}>
            <input
              type="text"
              value={rechargeCode}
              onChange={(e) => setRechargeCode(e.target.value.toUpperCase())}
              placeholder={lang === 'zh' ? '请输入积分码，如 XXXX-XXXX-XXXX-XXXX' : 'Enter code like XXXX-XXXX-XXXX-XXXX'}
              className={styles.activateInput}
              onKeyDown={(e) => e.key === 'Enter' && handleRecharge()}
              id="rechargeInput"
            />
            <button
              onClick={handleRecharge}
              disabled={recharging}
              className={styles.rechargeBtn}
            >
              {recharging ? '...' : (lang === 'zh' ? '充值' : 'Recharge')}
            </button>
          </div>
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

              return (
                <div key={tool.id} className={`${styles.toolCard} ${isComing ? styles.coming : ''}`}>
                  <div className={styles.toolIcon}>{tool.icon || '🔧'}</div>
                  {(tool.tutorialContent || tool.tutorialUrl) && (
                    <Link
                      href={`/tutorials/${tool.nameEn || tool.id}`}
                      className={styles.tutorialLink}
                      title="查看使用教程"
                      target="_blank"
                    >
                      <BookOpen size={13} />
                      教程
                    </Link>
                  )}
                  <div className={styles.toolInfo}>
                    <h3>{lang === 'en' && tool.nameEn ? tool.nameEn : tool.name}</h3>
                    <p>{lang === 'en' && tool.descriptionEn ? tool.descriptionEn : tool.description}</p>
                  </div>
                  <div className={styles.toolFooter}>
                    <span className={styles.toolCost}>
                      <Coins size={14} />
                      {`${tool.points} ${lang === 'zh' ? '积分' : 'pts'}`}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {isComing ? (
                        <span className={styles.comingBadge}>{lang === 'zh' ? '即将上线' : 'Coming'}</span>
                      ) : !isSubscribed ? (
                        <button className={`${styles.useBtn} ${styles.renewBtn}`} onClick={() => setShowRenewalModal(true)}>
                          <Crown size={14} />
                          {lang === 'zh' ? '续费年卡' : 'Renew'}
                        </button>
                      ) : tool.url ? (
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
                          {isUsing ? <span className={styles.btnSpinner} /> : (
                            <><ExternalLink size={14} />{canAfford ? (lang === 'zh' ? '开始使用' : 'Use') : (lang === 'zh' ? '积分不足' : 'Need pts')}</>
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

      {/* 续费引导弹窗 */}
      {showRenewalModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRenewalModal(false)}>
          <div className={styles.renewalModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowRenewalModal(false)}>
              <X size={18} />
            </button>
            <div className={styles.modalIcon}>👑</div>
            <h3 className={styles.modalTitle}>
              {subscriptionExpiry ? '年卡已到期' : '尚未激活年卡'}
            </h3>
            <p className={styles.modalBody}>
              {subscriptionExpiry
                ? `您的年卡已于 ${subscriptionExpiry.toLocaleDateString('zh-CN')} 到期，续费后可继续使用所有工具。`
                : '使用工具需要激活年卡。'}
            </p>
            <p className={styles.modalContact}>
              请联系鹏哥微信：<span>Peng_IP</span> 购买年卡或者获得7天试用
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalPrimaryBtn}
                onClick={() => {
                  setShowRenewalModal(false);
                  document.getElementById('activateInput')?.focus();
                  document.getElementById('activateInput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <Key size={15} />
                输入激活码
              </button>
              <button className={styles.modalSecondaryBtn} onClick={() => setShowRenewalModal(false)}>
                稍后再说
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
