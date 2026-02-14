'use client';

import { useState, useEffect } from 'react';
import { Users, Wrench, MousePointer, TrendingUp } from 'lucide-react';
import styles from './admin.module.scss';

interface Stats {
  totalUsers: number;
  todayUsers: number;
  totalToolUsages: number;
  todayToolUsages: number;
  activeTools: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>仪表盘</h1>
        <p>欢迎回来，这是网站的运营概览</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <Users size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            总用户数
          </div>
          <div className={styles.statValue}>{stats?.totalUsers || 0}</div>
          <div className={styles.statChange}>今日新增 +{stats?.todayUsers || 0}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <MousePointer size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            工具使用次数
          </div>
          <div className={styles.statValue}>{stats?.totalToolUsages || 0}</div>
          <div className={styles.statChange}>今日 +{stats?.todayToolUsages || 0}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <Wrench size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            上线工具数
          </div>
          <div className={styles.statValue}>{stats?.activeTools || 0}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <TrendingUp size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            转化率
          </div>
          <div className={styles.statValue}>--</div>
          <div className={styles.statChange}>敬请期待</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>快速操作</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/admin/users" className={`${styles.btn} ${styles.btnPrimary}`}>
            <Users size={16} />
            管理用户
          </a>
          <a href="/admin/tools" className={`${styles.btn} ${styles.btnPrimary}`}>
            <Wrench size={16} />
            管理工具
          </a>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>系统信息</h2>
        </div>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td>数据库</td>
              <td>SQLite (开发环境)</td>
            </tr>
            <tr>
              <td>框架</td>
              <td>Next.js 16</td>
            </tr>
            <tr>
              <td>部署状态</td>
              <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>本地开发</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
