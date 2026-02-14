'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import styles from '../login/auth.module.scss';

function RegisterForm() {
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<'email' | 'phone'>('phone');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState('');
  const [inviteCode, setInviteCode] = useState(searchParams.get('invite') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 加载验证码
  const loadCaptcha = () => {
    setCaptchaUrl(`/api/captcha?t=${Date.now()}`);
    setCaptcha('');
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!account) {
      setError(accountType === 'email' ? '请输入邮箱' : '请输入手机号');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    if (!captcha) {
      setError('请输入验证码');
      return;
    }

    // 验证格式
    if (accountType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
      setError('邮箱格式不正确');
      return;
    }

    if (accountType === 'phone' && !/^1[3-9]\d{9}$/.test(account)) {
      setError('手机号格式不正确');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [accountType]: account,
          password,
          captcha,
          inviteCode: inviteCode || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 使用 window.location 确保完整页面加载（cookie 生效）
        window.location.href = '/dashboard';
      } else {
        setError(data.error || '注册失败');
        loadCaptcha();
      }
    } catch {
      setError('注册失败，请稍后重试');
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
          <h1>注册</h1>
          <p>创建账户，开启AI赋能之旅</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && <div className={styles.error}>{error}</div>}

          {/* 账号类型切换 */}
          <div className={styles.tabGroup}>
            <button
              type="button"
              className={`${styles.tab} ${accountType === 'phone' ? styles.active : ''}`}
              onClick={() => { setAccountType('phone'); setAccount(''); }}
            >
              手机号注册
            </button>
            <button
              type="button"
              className={`${styles.tab} ${accountType === 'email' ? styles.active : ''}`}
              onClick={() => { setAccountType('email'); setAccount(''); }}
            >
              邮箱注册
            </button>
          </div>

          <div className={styles.formGroup}>
            <label>{accountType === 'email' ? '邮箱' : '手机号'}</label>
            <input
              type={accountType === 'email' ? 'email' : 'tel'}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={accountType === 'email' ? '请输入邮箱' : '请输入手机号'}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
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

          <div className={styles.formGroup}>
            <label>邀请码（选填）</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="如有邀请码请填写"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>

          <p className={styles.bonus}>🎁 新用户注册即送100积分</p>
        </form>

        <div className={styles.authFooter}>
          <p>
            已有账户？{' '}
            <Link href="/login">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>加载中...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
