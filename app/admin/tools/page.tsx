'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Key, Copy, Check, Download, Eye, EyeOff } from 'lucide-react';
import styles from '../admin.module.scss';

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
  sortOrder: number;
  visible: boolean;
  _count: {
    usages: number;
  };
}

interface ActivationCode {
  id: string;
  code: string;
  toolId: string;
  userId: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  usedAt: string | null;
}

interface CodeStats {
  total: number;
  unused: number;
  assigned: number;
  used: number;
}

const defaultTool = {
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  icon: '',
  points: 5,
  url: '',
  downloadUrl: '',
  status: 'active',
  sortOrder: 0,
  visible: true,
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultTool);
  // 激活码相关
  const [codesToolId, setCodesToolId] = useState<string | null>(null);
  const [codesToolName, setCodesToolName] = useState('');
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [codeStats, setCodeStats] = useState<CodeStats | null>(null);
  const [codesLoading, setCodesLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(5);
  const [generateNote, setGenerateNote] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [codeFilter, setCodeFilter] = useState('');

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const res = await fetch('/api/admin/tools');
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools);
      }
    } catch (error) {
      console.error('Fetch tools error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/admin/tools/${editingId}` : '/api/admin/tools';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchTools();
        setShowForm(false);
        setEditingId(null);
        setFormData(defaultTool);
      }
    } catch (error) {
      console.error('Save tool error:', error);
    }
  };

  const handleEdit = (tool: Tool) => {
    setFormData({
      name: tool.name,
      nameEn: tool.nameEn || '',
      description: tool.description,
      descriptionEn: tool.descriptionEn || '',
      icon: tool.icon || '',
      points: tool.points,
      url: tool.url || '',
      downloadUrl: tool.downloadUrl || '',
      status: tool.status,
      sortOrder: tool.sortOrder,
      visible: tool.visible,
    });
    setEditingId(tool.id);
    setShowForm(true);
  };

  // 激活码管理
  const openCodeManager = (tool: Tool) => {
    setCodesToolId(tool.id);
    setCodesToolName(tool.name);
    fetchCodes(tool.id);
  };

  const fetchCodes = async (toolId: string, statusFilter?: string) => {
    setCodesLoading(true);
    try {
      const url = statusFilter
        ? `/api/admin/tools/${toolId}/codes?status=${statusFilter}`
        : `/api/admin/tools/${toolId}/codes`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes);
        setCodeStats(data.stats);
      }
    } catch (e) { console.error(e); }
    finally { setCodesLoading(false); }
  };

  const handleGenerateCodes = async () => {
    if (!codesToolId) return;
    try {
      const res = await fetch(`/api/admin/tools/${codesToolId}/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: generateCount, note: generateNote || null }),
      });
      if (res.ok) {
        fetchCodes(codesToolId, codeFilter || undefined);
        setGenerateNote('');
      }
    } catch (e) { console.error(e); }
  };

  const handleCodeAction = async (codeId: string, action: string) => {
    if (!codesToolId) return;
    try {
      const res = await fetch(`/api/admin/tools/${codesToolId}/codes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId, action }),
      });
      if (res.ok) {
        fetchCodes(codesToolId, codeFilter || undefined);
      }
    } catch (e) { console.error(e); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const copyAllUnused = () => {
    const unusedCodes = codes.filter(c => c.status === 'unused').map(c => c.code).join('\n');
    navigator.clipboard.writeText(unusedCodes);
    setCopiedCode('all');
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const exportUnusedAsTxt = () => {
    const unusedCodes = codes.filter(c => c.status === 'unused').map(c => c.code).join('\n');
    if (!unusedCodes) { alert('没有未使用的激活码'); return; }
    const blob = new Blob([unusedCodes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${codesToolName}_激活码_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个工具吗？')) return;

    try {
      const res = await fetch(`/api/admin/tools/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTools(tools.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Delete tool error:', error);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(defaultTool);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>工具管理</h1>
        <p>管理AI工具，设置积分消耗</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>工具列表</h2>
          <button
            onClick={() => setShowForm(true)}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Plus size={16} />
            添加工具
          </button>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
          </div>
        ) : tools.length === 0 ? (
          <div className={styles.emptyState}>暂无工具，点击上方按钮添加</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>积分</th>
                  <th>使用次数</th>
                  <th>状态</th>
                  <th>首页显示</th>
                  <th>排序</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id} style={{ opacity: tool.visible ? 1 : 0.6 }}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{tool.name}</div>
                        {tool.nameEn && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {tool.nameEn}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {tool.points}
                      </span>
                    </td>
                    <td>{tool._count.usages}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        tool.status === 'active' ? styles.badgeSuccess :
                        tool.status === 'coming' ? styles.badgeWarning :
                        styles.badgeDanger
                      }`}>
                        {tool.status === 'active' ? '上线' :
                         tool.status === 'coming' ? '即将上线' : '下线'}
                      </span>
                    </td>
                    <td>
                      {tool.visible ? (
                        <Eye size={16} style={{ color: '#16a34a' }} />
                      ) : (
                        <EyeOff size={16} style={{ color: '#94a3b8' }} />
                      )}
                    </td>
                    <td>{tool.sortOrder}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => openCodeManager(tool)}
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                          title="激活码管理"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(tool)}
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                          title="编辑"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tool.id)}
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 激活码管理弹窗 */}
      {codesToolId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '1.5rem',
            width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                <Key size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                {codesToolName} - 激活码管理
              </h2>
              <button onClick={() => { setCodesToolId(null); setCodes([]); setCodeStats(null); }} style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            {/* 统计 */}
            {codeStats && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.85rem' }}>
                  总计 <strong>{codeStats.total}</strong>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.85rem', color: '#16a34a' }}>
                  未使用 <strong>{codeStats.unused}</strong>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: '#eff6ff', borderRadius: '8px', fontSize: '0.85rem', color: '#2563eb' }}>
                  已分配 <strong>{codeStats.assigned}</strong>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: '#fef2f2', borderRadius: '8px', fontSize: '0.85rem', color: '#dc2626' }}>
                  已使用 <strong>{codeStats.used}</strong>
                </div>
              </div>
            )}

            {/* 生成区 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 80px' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>数量</label>
                <input
                  type="number" min={1} max={100}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                  className={styles.input}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>备注（选填）</label>
                <input
                  type="text"
                  value={generateNote}
                  onChange={(e) => setGenerateNote(e.target.value)}
                  className={styles.input}
                  placeholder="如：发给XX客户"
                  style={{ width: '100%' }}
                />
              </div>
              <button onClick={handleGenerateCodes} className={`${styles.btn} ${styles.btnPrimary}`}>
                <Plus size={14} /> 生成激活码
              </button>
            </div>

            {/* 筛选 + 复制 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={codeFilter}
                onChange={(e) => { setCodeFilter(e.target.value); fetchCodes(codesToolId, e.target.value || undefined); }}
                className={styles.input}
                style={{ width: 'auto', minWidth: '100px' }}
              >
                <option value="">全部</option>
                <option value="unused">未使用</option>
                <option value="assigned">已分配</option>
                <option value="used">已使用</option>
                <option value="expired">已作废</option>
              </select>
              <button onClick={copyAllUnused} className={`${styles.btn} ${styles.btnSecondary}`} style={{ fontSize: '0.8rem' }}>
                {copiedCode === 'all' ? <><Check size={14} /> 已复制</> : <><Copy size={14} /> 复制全部未使用</>}
              </button>
              <button onClick={exportUnusedAsTxt} className={`${styles.btn} ${styles.btnSecondary}`} style={{ fontSize: '0.8rem' }}>
                <Download size={14} /> 导出TXT
              </button>
            </div>

            {/* 激活码列表 */}
            {codesLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>加载中...</div>
            ) : codes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>暂无激活码，点击上方生成</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>激活码</th>
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
                          <span className={`${styles.badge} ${
                            c.status === 'unused' ? styles.badgeSuccess :
                            c.status === 'assigned' ? styles.badgeWarning :
                            c.status === 'used' ? styles.badgeDanger :
                            styles.badgeDanger
                          }`}>
                            {c.status === 'unused' ? '未使用' :
                             c.status === 'assigned' ? '已分配' :
                             c.status === 'used' ? '已使用' : '已作废'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.note || '-'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              onClick={() => copyCode(c.code)}
                              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                              title="复制"
                            >
                              {copiedCode === c.code ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            {(c.status === 'unused' || c.status === 'assigned') && (
                              <button
                                onClick={() => handleCodeAction(c.id, 'expire')}
                                className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                                title="作废"
                              >
                                <X size={12} />
                              </button>
                            )}
                            {(c.status === 'expired') && (
                              <button
                                onClick={() => handleCodeAction(c.id, 'reset')}
                                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                                title="恢复"
                              >
                                ↩
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '1rem',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingId ? '编辑工具' : '添加工具'}
              </h2>
              <button onClick={closeForm} style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>名称 (中文) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>名称 (英文)</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>描述 (中文) *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>描述 (英文)</label>
                <input
                  type="text"
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>积分消耗</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>排序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>跳转链接</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className={styles.input}
                  placeholder="https://..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>下载地址（百度网盘等）</label>
                <input
                  type="text"
                  value={formData.downloadUrl}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  className={styles.input}
                  placeholder="https://pan.baidu.com/s/..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={styles.input}
                  >
                    <option value="active">上线</option>
                    <option value="coming">即将上线</option>
                    <option value="inactive">下线</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>首页显示</label>
                  <div
                    onClick={() => setFormData({ ...formData, visible: !formData.visible })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px',
                      cursor: 'pointer', background: formData.visible ? '#f0fdf4' : '#f8fafc',
                      transition: 'all 0.2s',
                    }}
                  >
                    {formData.visible ? (
                      <><Eye size={16} style={{ color: '#16a34a' }} /> <span style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 500 }}>显示</span></>
                    ) : (
                      <><EyeOff size={16} style={{ color: '#94a3b8' }} /> <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>隐藏</span></>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }}>
                  {editingId ? '保存修改' : '添加工具'}
                </button>
                <button type="button" onClick={closeForm} className={`${styles.btn} ${styles.btnSecondary}`}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
