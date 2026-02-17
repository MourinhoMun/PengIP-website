'use client';

import { useState, useEffect } from 'react';
import { Plus, Copy, Check, Download, X, Key } from 'lucide-react';
import styles from '../admin.module.scss';

interface GlobalCode {
  id: string;
  code: string;
  type: string;
  points: number;
  userId: string | null;
  deviceId: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  usedAt: string | null;
}

export default function GlobalCodesPage() {
  const [codes, setCodes] = useState<GlobalCode[]>([]);
  const [loading, setLoading] = useState(true);
  // 生成表单
  const [codeType, setCodeType] = useState<'license' | 'recharge'>('recharge');
  const [points, setPoints] = useState(100);
  const [count, setCount] = useState(10);
  const [note, setNote] = useState('');
  const [generating, setGenerating] = useState(false);
  // 筛选
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  // 复制
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, [filterType, filterStatus]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/admin/global-codes${query}`);
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (points <= 0) { alert('积分必须大于0'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/global-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: codeType, points, count, note: note || null }),
      });
      if (res.ok) {
        setNote('');
        fetchCodes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const copyAllUnused = () => {
    const unusedCodes = codes.filter(c => c.status === 'unused').map(c => c.code).join('\n');
    if (!unusedCodes) { alert('没有未使用的充值码'); return; }
    navigator.clipboard.writeText(unusedCodes);
    setCopiedCode('all');
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const exportUnusedAsTxt = () => {
    const unusedCodes = codes.filter(c => c.status === 'unused').map(c => c.code).join('\n');
    if (!unusedCodes) { alert('没有未使用的充值码'); return; }
    const blob = new Blob([unusedCodes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const typeName = filterType === 'license' ? '许可证码' : filterType === 'recharge' ? '充值码' : '全局码';
    a.download = `${typeName}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unusedCount = codes.filter(c => c.status === 'unused').length;
  const usedCount = codes.filter(c => c.status === 'used').length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>充值码管理</h1>
        <p>管理许可证码和充值码，批量生成后导出到发卡平台</p>
      </div>

      {/* 生成区域 */}
      <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.cardHeader}>
          <h2>批量生成</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>类型</label>
            <select
              value={codeType}
              onChange={(e) => setCodeType(e.target.value as 'license' | 'recharge')}
              className={styles.input}
              style={{ width: 'auto', minWidth: '120px' }}
            >
              <option value="recharge">充值码</option>
              <option value="license">许可证码</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>积分</label>
            <input
              type="number" min={1}
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              className={styles.input}
              style={{ width: '100px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>数量</label>
            <input
              type="number" min={1} max={100}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className={styles.input}
              style={{ width: '80px' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>备注（选填）</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={styles.input}
              placeholder="如：发卡平台-100积分档"
              style={{ width: '100%' }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={14} /> {generating ? '生成中...' : '生成'}
          </button>
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <strong>许可证码</strong>：用户首次激活客户端软件（创建账户+充积分）。
          <strong>充值码</strong>：已激活用户补充积分。发卡平台一般卖充值码。
        </div>
      </div>

      {/* 列表区域 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>
            <Key size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            码列表
          </h2>
        </div>

        {/* 统计 */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.85rem' }}>
            总计 <strong>{codes.length}</strong>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.85rem', color: '#16a34a' }}>
            未使用 <strong>{unusedCount}</strong>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: '#fef2f2', borderRadius: '8px', fontSize: '0.85rem', color: '#dc2626' }}>
            已使用 <strong>{usedCount}</strong>
          </div>
        </div>

        {/* 筛选 + 操作 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.input}
            style={{ width: 'auto', minWidth: '100px' }}
          >
            <option value="">全部类型</option>
            <option value="license">许可证码</option>
            <option value="recharge">充值码</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.input}
            style={{ width: 'auto', minWidth: '100px' }}
          >
            <option value="">全部状态</option>
            <option value="unused">未使用</option>
            <option value="used">已使用</option>
          </select>
          <button onClick={copyAllUnused} className={`${styles.btn} ${styles.btnSecondary}`} style={{ fontSize: '0.8rem' }}>
            {copiedCode === 'all' ? <><Check size={14} /> 已复制</> : <><Copy size={14} /> 复制全部未使用</>}
          </button>
          <button onClick={exportUnusedAsTxt} className={`${styles.btn} ${styles.btnSecondary}`} style={{ fontSize: '0.8rem' }}>
            <Download size={14} /> 导出TXT
          </button>
        </div>

        {/* 表格 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div className={styles.spinner} />
          </div>
        ) : codes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>暂无充值码，在上方生成</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>充值码</th>
                  <th>类型</th>
                  <th>积分</th>
                  <th>状态</th>
                  <th>备注</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px', color: '#1e293b' }}>{c.code}</code>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${c.type === 'license' ? styles.badgeInfo : styles.badgeWarning}`}>
                        {c.type === 'license' ? '许可证' : '充值'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.points}</td>
                    <td>
                      <span className={`${styles.badge} ${c.status === 'unused' ? styles.badgeSuccess : styles.badgeDanger}`}>
                        {c.status === 'unused' ? '未使用' : '已使用'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.note || '-'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td>
                      <button
                        onClick={() => copyCode(c.code)}
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                        title="复制"
                      >
                        {copiedCode === c.code ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
