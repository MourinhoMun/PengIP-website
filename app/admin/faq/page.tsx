'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import styles from '../admin.module.scss';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

const emptyForm = { question: '', answer: '', category: 'general', sortOrder: 0, active: true };

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faq');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs);
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, sortOrder: faq.sortOrder, active: faq.active });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      alert('问题和答案不能为空');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/faq/${editingId}` : '/api/admin/faq';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        fetchFAQs();
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    await fetch(`/api/admin/faq/${faq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !faq.active }),
    });
    fetchFAQs();
  };

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`确认删除 FAQ：「${question}」？`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFaqs((prev) => prev.filter((f) => f.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>FAQ 管理</h1>
        <p>管理客服知识库，FAQ 会注入到 AI 客服的上下文中</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>FAQ 列表（共 {faqs.length} 条）</h2>
          <button onClick={openCreate} className={`${styles.btn} ${styles.btnPrimary}`}>
            <Plus size={14} /> 新增 FAQ
          </button>
        </div>

        {/* 新增/编辑表单 */}
        {showForm && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#1e293b' }}>{editingId ? '编辑 FAQ' : '新增 FAQ'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>问题 *</label>
                <input
                  className={styles.input}
                  style={{ width: '100%' }}
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  placeholder="例：如何注册？"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>答案 *</label>
                <textarea
                  className={styles.input}
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                  placeholder="输入详细答案..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>分类</label>
                  <select
                    className={styles.input}
                    style={{ width: 'auto', minWidth: '120px' }}
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option value="general">通用</option>
                    <option value="tools">工具</option>
                    <option value="points">积分</option>
                    <option value="member">会员</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>排序</label>
                  <input
                    type="number"
                    className={styles.input}
                    style={{ width: '80px' }}
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>启用</label>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button onClick={handleSave} disabled={saving} className={`${styles.btn} ${styles.btnPrimary}`}>
                  <Check size={14} /> {saving ? '保存中...' : '保存'}
                </button>
                <button onClick={() => setShowForm(false)} className={`${styles.btn} ${styles.btnSecondary}`}>
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div className={styles.spinner} />
          </div>
        ) : faqs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>暂无 FAQ，点击上方按钮新增</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>排序</th>
                  <th>问题</th>
                  <th>答案</th>
                  <th style={{ width: '60px' }}>分类</th>
                  <th style={{ width: '60px' }}>状态</th>
                  <th style={{ width: '100px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq) => (
                  <tr key={faq.id}>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{faq.sortOrder}</td>
                    <td style={{ fontWeight: 500, maxWidth: '200px' }}>{faq.question}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {faq.answer}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeInfo}`}>{faq.category}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(faq)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: faq.active ? '#22c55e' : '#94a3b8', padding: 0 }}
                        title={faq.active ? '点击禁用' : '点击启用'}
                      >
                        {faq.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => openEdit(faq)}
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                        title="编辑"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id, faq.question)}
                        disabled={deletingId === faq.id}
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                        style={{ marginLeft: '0.35rem' }}
                        title="删除"
                      >
                        <Trash2 size={12} />
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
