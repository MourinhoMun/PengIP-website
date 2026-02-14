'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
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

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>用户管理</h1>
        <p>管理注册用户，调整积分</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>用户列表</h2>
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
    </div>
  );
}
