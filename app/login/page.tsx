'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './auth.module.scss';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const msg = searchParams.get('msg');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // 加载验证码
  const loadCaptcha = () => {
    setCaptchaUrl(`/api/captcha?t=${Date.now()}`);
    setCaptcha('');
  };

  useEffect(() => {
    loadCaptcha();
    if (msg === 'admin') {
      setInfo('请先登录管理员账户');
    }
  }, [msg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!account || !password) {
      setError('请输入账号和密码');
      return;
    }

    if (!captcha) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password, captcha }),
      });

      const data = await res.json();

      if (res.ok) {
        // 有指定跳转地址就用指定的，否则管理员→后台，普通用户→用户中心
        const targetUrl = redirectParam
          || (data.user?.role === 'admin' ? '/admin' : '/dashboard');
        // 使用 window.location 确保完整页面加载（cookie 生效）
        window.location.href = targetUrl;
      } else {
        setError(data.error || '登录失败');
        loadCaptcha();
      }
    } catch {
      setError('登录失败，请稍后重试');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <Link href="/" className={styles.logo}>鹏哥</Link>
          <h1>登录</h1>
          <p>欢迎回来，请登录您的账户</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {info && <div className={styles.info}>{info}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label>手机号 / 邮箱</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="请输入手机号或邮箱"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>验证码</label>
            <div className={styles.captchaRow}>
              <input
                type="text"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                placeholder="请输入验证码"
                maxLength={4}
                required
              />
              <div className={styles.captchaBox} onClick={loadCaptcha}>
                {captchaUrl && (
                  <Image
                    src={captchaUrl}
                    alt="验证码"
                    width={120}
                    height={40}
                    unoptimized
                  />
                )}
                <button type="button" className={styles.refreshBtn} title="刷新验证码">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p>
            还没有账户？{' '}
            <Link href="/register">立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>加载中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
