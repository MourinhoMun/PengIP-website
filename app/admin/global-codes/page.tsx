'use client';

import { useState, useEffect } from 'react';
import { Plus, Copy, Check, Download, X, Key, Search, Trash2 } from 'lucide-react';
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
  const [codeType, setCodeType] = useState<'annual' | 'recharge' | 'trial'>('annual');
  const [points, setPoints] = useState(100);
  const [count, setCount] = useState(10);
  const [note, setNote] = useState('');
  const [generating, setGenerating] = useState(false);
  // 筛选
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchCode, setSearchCode] = useState('');
  // 复制
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, [filterType, filterStatus]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (searchCode.trim()) params.set('search', searchCode.trim());
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
    if (codeType === 'recharge' && points <= 0) { alert('积分必须大于0'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/global-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: codeType, points: codeType === 'annual' ? 0 : points, count, note: note || null }),
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
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 1500);
      }).catch(() => {
        // fallback
        const el = document.createElement('textarea');
        el.value = code;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 1500);
      });
    } else {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`确认删除激活码 ${code}？此操作不可撤销。`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/global-codes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCodes(prev => prev.filter(c => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setDeletingId(null);
    }
  };

  const copyAllUnused = () => {
    const unusedCodes = codes.filter(c => c.status === 'unused').map(c => c.code).join('\n');
    if (!unusedCodes) { alert('没有未使用的充值码'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(unusedCodes).then(() => {
        setCopiedCode('all');
        setTimeout(() => setCopiedCode(null), 1500);
      }).catch(() => {
        const el = document.createElement('textarea');
        el.value = unusedCodes;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedCode('all');
        setTimeout(() => setCopiedCode(null), 1500);
      });
    } else {
      const el = document.createElement('textarea');
      el.value = unusedCodes;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCode('all');
      setTimeout(() => setCopiedCode(null), 1500);
    }
  };

  const exportUnusedAsTxt = () => {
    const unusedCodes = codes.filter(c => c.status === 'unused').map(c => c.code).join('\n');
    if (!unusedCodes) { alert('没有未使用的充值码'); return; }
    const blob = new Blob([unusedCodes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const typeName = filterType === 'annual' ? '年卡码' : filterType === 'recharge' ? '充值码' : '全局码';
    a.download = `${typeName}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unusedCount = codes.filter(c => c.status === 'unused').length;
  const usedCount = codes.filter(c => c.status === 'used').length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>激活码管理</h1>
        <p>管理年卡激活码和积分充值码，批量生成后分发给代理</p>
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
              onChange={(e) => setCodeType(e.target.value as 'annual' | 'recharge')}
              className={styles.input}
              style={{ width: 'auto', minWidth: '120px' }}
            >
              <option value="annual">年卡码</option>
              <option value="recharge">充值码</option>
              <option value="trial">试用码</option>
            </select>
          </div>
          {codeType === 'recharge' && (
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
          )}
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
          <strong>年卡码</strong>：激活后账号有效期 +365 天，首次激活赠 1000 积分。
          <strong style={{ marginLeft: '0.75rem' }}>充值码</strong>：给已有用户补充积分。
          <strong style={{ marginLeft: '0.75rem' }}>试用码</strong>：7天试用期 + 100积分，一码一用。
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
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && fetchCodes()}
              placeholder="搜索激活码..."
              className={styles.input}
              style={{ paddingLeft: '28px', width: '200px' }}
            />
          </div>
          <button onClick={fetchCodes} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}>
            <Search size={14} /> 搜索
          </button>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.input}
            style={{ width: 'auto', minWidth: '100px' }}
          >
            <option value="">全部类型</option>
            <option value="annual">年卡码</option>
            <option value="recharge">充值码</option>
            <option value="trial">试用码</option>
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
                      <span className={`${styles.badge} ${c.type === 'annual' ? styles.badgeInfo : c.type === 'trial' ? styles.badgeWarning : styles.badgeWarning}`}>
                        {c.type === 'annual' ? '年卡' : c.type === 'trial' ? '试用' : '充值'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {c.type === 'annual' ? <span style={{ color: '#94a3b8' }}>—</span> : c.points}
                    </td>
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
                      {c.status === 'unused' && (
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          disabled={deletingId === c.id}
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                          style={{ marginLeft: '0.35rem' }}
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
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
