/**
 * helpers.ts
 * 共享工具函数：验证码绕过、登录、登出
 */
import { Page, expect } from '@playwright/test';

export const TEST_PASSWORD = 'TestPass123!';

/**
 * 拦截 /api/captcha 请求，返回一张已知验证码的 SVG 图，
 * 同时通过 addCookies 注入对应 cookie（绕过 httpOnly 限制）。
 * 服务端登录时会比较 cookie 值与用户输入（均 toLowerCase），两者匹配即通过。
 */
export const BYPASS_CAPTCHA = 'TEST';

export async function setupCaptchaBypass(page: Page): Promise<string> {
  await page.route(/\/api\/captcha(\?|$)/, async route => {
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">
        <rect width="120" height="40" fill="#eee"/>
        <text x="20" y="28" font-size="20" fill="#333">${BYPASS_CAPTCHA}</text>
      </svg>`,
    });
  });
  return BYPASS_CAPTCHA;
}

/**
 * 在验证码 SVG 被拦截（未设 cookie）后，手动注入 captcha cookie。
 * 必须在 page.goto() 之后调用（需要 page.url() 来确定 domain）。
 */
export async function injectCaptchaCookie(page: Page, value = BYPASS_CAPTCHA) {
  const url = new URL(page.url());
  await page.context().addCookies([{
    name:     'captcha',
    value:    value.toLowerCase(),
    domain:   url.hostname,
    path:     '/',
    httpOnly: true,
    secure:   url.protocol === 'https:',
    sameSite: 'Lax',
  }]);
}

/**
 * 完整登录流程：绕过验证码 → 填表 → 等待倒计时 → 提交
 */
export async function loginAs(page: Page, email: string, password = TEST_PASSWORD) {
  // 1. 注册拦截器（必须在 goto 之前）
  await setupCaptchaBypass(page);

  // 2. 导航到登录页
  await page.goto('/login');

  // 3. 注入 captcha cookie（拦截后服务端不会 Set-Cookie，需手动补）
  await injectCaptchaCookie(page);

  // 4. 填写账号密码
  await page.fill('input[placeholder="请输入手机号或邮箱"]', email);
  await page.fill('input[placeholder="请输入密码"]', password);

  // 5. 等待服务条款倒计时结束（3 秒），按钮文字变为「登录」
  await expect(page.locator('button[type="submit"]')).toContainText('登录', { timeout: 8000 });

  // 6. 填验证码
  await page.fill('input[placeholder="请输入验证码"]', BYPASS_CAPTCHA);

  // 7. 提交
  await page.click('button[type="submit"]');

  // 8. 等待跳转（离开 /login 页）
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });

  // 清理路由拦截
  await page.unroute(/\/api\/captcha(\?|$)/);
}

/**
 * 从导航栏登出
 */
export async function logoutFromNavbar(page: Page) {
  // 点击用户名按钮打开菜单
  await page.locator('.userBtn').click();
  // 点击「退出登录」
  await page.locator('.menuItem', { hasText: '退出登录' }).click();
  // 等待跳转到首页
  await page.waitForURL('/', { timeout: 5000 });
}

/**
 * 从 Dashboard 登出
 */
export async function logoutFromDashboard(page: Page) {
  await page.locator('.logoutBtn').click();
  await page.waitForURL('/', { timeout: 5000 });
}
