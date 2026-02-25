/**
 * auth.spec.ts
 * 测试用户注册、登录、登出流程
 */
import { test, expect } from '@playwright/test';
import {
  TEST_PASSWORD,
  BYPASS_CAPTCHA,
  setupCaptchaBypass,
  injectCaptchaCookie,
  loginAs,
  logoutFromNavbar,
} from './helpers';
import { TEST_USERS } from './global-setup';

// ─────────────────────────────────────────────────────────────────
// 登录
// ─────────────────────────────────────────────────────────────────
test.describe('登录', () => {
  test('正确账号密码 → 登录成功，导航栏显示用户名', async ({ page }) => {
    await loginAs(page, TEST_USERS.normal.email);

    // 导航栏应出现用户信息
    await expect(page.locator('.userName')).toBeVisible();
    // 导航栏应显示积分数字
    await expect(page.locator('.userPoints')).toBeVisible();
  });

  test('错误密码 → 提示「账号或密码错误」', async ({ page }) => {
    await setupCaptchaBypass(page);
    await page.goto('/login');
    await injectCaptchaCookie(page);

    await page.fill('input[placeholder="请输入手机号或邮箱"]', TEST_USERS.normal.email);
    await page.fill('input[placeholder="请输入密码"]', 'WrongPassword!');

    await expect(page.locator('button[type="submit"]')).toContainText('登录', { timeout: 8000 });
    await page.fill('input[placeholder="请输入验证码"]', BYPASS_CAPTCHA);
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText('账号或密码错误');
  });

  test('错误验证码 → 提示验证码相关错误', async ({ page }) => {
    await setupCaptchaBypass(page);
    await page.goto('/login');
    // 不注入 cookie，改为注入错误值
    const url = new URL(page.url());
    await page.context().addCookies([{
      name: 'captcha', value: 'xxxx',
      domain: url.hostname, path: '/', httpOnly: true,
      secure: url.protocol === 'https:', sameSite: 'Lax',
    }]);

    await page.fill('input[placeholder="请输入手机号或邮箱"]', TEST_USERS.normal.email);
    await page.fill('input[placeholder="请输入密码"]', TEST_PASSWORD);

    await expect(page.locator('button[type="submit"]')).toContainText('登录', { timeout: 8000 });
    await page.fill('input[placeholder="请输入验证码"]', 'YYYY'); // cookie=xxxx, input=yyyy → 不匹配
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText('验证码');
  });
});

// ─────────────────────────────────────────────────────────────────
// 登出
// ─────────────────────────────────────────────────────────────────
test.describe('登出', () => {
  test('从导航栏登出 → 返回首页，导航栏不再显示用户名', async ({ page }) => {
    await loginAs(page, TEST_USERS.normal.email);

    // 确认登录成功
    await expect(page.locator('.userName')).toBeVisible();

    // 登出
    await logoutFromNavbar(page);

    // 登出后在首页，导航栏变为登录/注册按钮
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('.userName')).not.toBeVisible();
  });

  test('登出后 localStorage 的 pengip_token 被清除', async ({ page }) => {
    await loginAs(page, TEST_USERS.normal.email);

    // 先访问 healvision 让 token 写入 localStorage
    await page.goto('/healvision/');
    await page.waitForTimeout(2000); // 等 autoLogin 完成

    // 回主站登出
    await page.goto('/');
    await logoutFromNavbar(page);

    // 验证 localStorage 已清除
    const token = await page.evaluate(() => localStorage.getItem('pengip_token'));
    expect(token).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────
// 注册
// ─────────────────────────────────────────────────────────────────
test.describe('注册', () => {
  test('邮箱注册 → 成功后登录，积分为 100', async ({ page }) => {
    const uniqueEmail = `e2e_reg_${Date.now()}@test.com`;

    await setupCaptchaBypass(page);
    await page.goto('/register');
    await injectCaptchaCookie(page);

    // 切换到邮箱注册 Tab
    await page.locator('button', { hasText: '邮箱注册' }).click();

    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[placeholder="请输入密码（至少6位）"]', TEST_PASSWORD);
    await page.fill('input[placeholder="请再次输入密码"]', TEST_PASSWORD);

    // 等待 5 秒服务条款倒计时
    await expect(page.locator('button[type="submit"]')).toContainText('同意条款并注册', { timeout: 10000 });
    await page.fill('input[placeholder="请输入验证码"]', BYPASS_CAPTCHA);

    await page.click('button[type="submit"]');

    // 注册成功后应跳转（离开 /register）
    await page.waitForURL(url => !url.pathname.includes('/register'), { timeout: 10000 });

    // 导航栏显示积分（新注册 = 100）
    await expect(page.locator('.userPoints')).toContainText('100');
  });

  test('密码不一致 → 提示错误', async ({ page }) => {
    await setupCaptchaBypass(page);
    await page.goto('/register');
    await injectCaptchaCookie(page);

    await page.locator('button', { hasText: '邮箱注册' }).click();
    await page.fill('input[type="email"]', 'mismatch@test.com');
    await page.fill('input[placeholder="请输入密码（至少6位）"]', 'Pass1234!');
    await page.fill('input[placeholder="请再次输入密码"]', 'Different!');

    await expect(page.locator('button[type="submit"]')).toContainText('同意条款并注册', { timeout: 10000 });
    await page.fill('input[placeholder="请输入验证码"]', BYPASS_CAPTCHA);
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText('两次密码输入不一致');
  });
});
