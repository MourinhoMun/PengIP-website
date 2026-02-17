'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus, X, UserPlus } from 'lucide-react';
import styles from '../admin.module.scss';

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  points: number;
  role: string;
  inviteCode: string;
  createdAt: string;
  _count: {
    invitedUsers: number;
    toolUsages: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  // 新增用户
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', phone: '', name: '', password: '', points: 100, role: 'user' });
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const fetchUsers = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.append('search', search);
      
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleAdjustPoints = async (userId: string, amount: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => 
          u.id === userId ? { ...u, points: data.newPoints } : u
        ));
        setAdjustUserId(null);
        setAdjustAmount('');
      }
    } catch (error) {
      console.error('Adjust points error:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.email && !createForm.phone) {
      setCreateError('请填写邮箱或手机号');
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      setCreateError('密码至少6位');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (res.ok) {
        setShowCreateForm(false);
        setCreateForm({ email: '', phone: '', name: '', password: '', points: 100, role: 'user' });
        fetchUsers(1);
      } else {
        setCreateError(data.error || '创建失败');
      }
    } catch {
      setCreateError('创建失败，请稍后重试');
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>用户管理</h1>
        <p>管理注册用户，调整积分</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>用户列表</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="搜索邮箱/手机号"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.input}
                style={{ width: '200px' }}
              />
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                <Search size={16} />
              </button>
            </form>
            <button
              onClick={() => setShowCreateForm(true)}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              <UserPlus size={16} /> 新增用户
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>暂无用户</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>账号</th>
                    <th>积分</th>
                    <th>邀请人数</th>
                    <th>工具使用</th>
                    <th>角色</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{user.name || '-'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {user.email || user.phone}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {user.points}
                        </span>
                      </td>
                      <td>{user._count.invitedUsers}</td>
                      <td>{user._count.toolUsages}</td>
                      <td>
                        <span className={`${styles.badge} ${user.role === 'admin' ? styles.badgeDanger : styles.badgeInfo}`}>
                          {user.role === 'admin' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td>
                        {adjustUserId === user.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <input
                              type="number"
                              placeholder="数量"
                              value={adjustAmount}
                              onChange={(e) => setAdjustAmount(e.target.value)}
                              className={styles.input}
                              style={{ width: '80px' }}
                            />
                            <button
                              onClick={() => handleAdjustPoints(user.id, parseInt(adjustAmount))}
                              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                            >
                              确定
                            </button>
                            <button
                              onClick={() => { setAdjustUserId(null); setAdjustAmount(''); }}
                              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className={styles.actions}>
                            <button
                              onClick={() => setAdjustUserId(user.id)}
                              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                              title="调整积分"
                            >
                              <Plus size={14} />
                              <Minus size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                >
                  上一页
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 新增用户弹窗 */}
      {showCreateForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '1.5rem',
            width: '100%', maxWidth: '450px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                新增用户
              </h2>
              <button onClick={() => { setShowCreateForm(false); setCreateError(''); }} style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '0.5rem 0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div className={styles.formGroup}>
                <label>邮箱</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className={styles.input}
                  placeholder="选填，邮箱和手机号至少填一个"
                />
              </div>
              <div className={styles.formGroup}>
                <label>手机号</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className={styles.input}
                  placeholder="选填"
                />
              </div>
              <div className={styles.formGroup}>
                <label>昵称</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className={styles.input}
                  placeholder="选填"
                />
              </div>
              <div className={styles.formGroup}>
                <label>密码 *</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className={styles.input}
                  placeholder="至少6位"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>初始积分</label>
                  <input
                    type="number"
                    value={createForm.points}
                    onChange={(e) => setCreateForm({ ...createForm, points: parseInt(e.target.value) || 0 })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>角色</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className={styles.input}
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }}>
                  创建用户
                </button>
                <button type="button" onClick={() => { setShowCreateForm(false); setCreateError(''); }} className={`${styles.btn} ${styles.btnSecondary}`}>
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
