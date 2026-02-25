/**
 * sub-apps.spec.ts
 * 测试子应用 autoLogin 和跨用户隔离
 *
 * 核心验证：
 * 1. 主站登录后，子应用无需再次输激活码（autoLogin）
 * 2. 主站登出后，子应用恢复激活页（token 已清除）
 * 3. 切换用户后，看不到前一个用户的数据（token 刷新）
 */
import { test, expect } from '@playwright/test';
import { loginAs, logoutFromNavbar } from './helpers';
import { TEST_USERS } from './global-setup';

/** 等待子应用 autoLogin 完成（最多 6 秒）*/
async function waitForSubAppReady(page: any) {
  // 等 loading 消失（有些子应用有 spinner）
  await page.waitForFunction(
    () => !document.querySelector('[style*="animate-spin"], .spinner, [class*="spin"]'),
    { timeout: 6000 },
  ).catch(() => { /* spinner 可能不存在，忽略 */ });
  // 再给 React 渲染留一点时间
  await page.waitForTimeout(500);
}

/** 检查子应用是否显示激活页（看到「激活码」输入框） */
async function isShowingActivationPage(page: any): Promise<boolean> {
  return page.locator('input[placeholder*="激活码"], text=请输入激活码').isVisible();
}

// ─────────────────────────────────────────────────────────────────
// HealVision
// ─────────────────────────────────────────────────────────────────
test.describe('HealVision autoLogin', () => {
  test('主站登录后访问 HealVision → 不出现激活码页面', async ({ page }) => {
    await loginAs(page, TEST_USERS.normal.email);

    await page.goto('/healvision/');
    await waitForSubAppReady(page);

    // 不应该看到激活码输入
    expect(await isShowingActivationPage(page)).toBe(false);

    // 应该看到主界面元素
    await expect(
      page.locator('text=新建案例, text=案例列表, text=工作台').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('主站登出后访问 HealVision → 出现激活码页面', async ({ page }) => {
    // 先登录并访问 healvision（写入 localStorage token）
    await loginAs(page, TEST_USERS.normal.email);
    await page.goto('/healvision/');
    await waitForSubAppReady(page);
    expect(await isShowingActivationPage(page)).toBe(false);

    // 主站登出（会清除 localStorage token）
    await page.goto('/');
    await logoutFromNavbar(page);

    // 再次访问 healvision
    await page.goto('/healvision/');
    await waitForSubAppReady(page);

    // 现在应该看到激活码页面
    expect(await isShowingActivationPage(page)).toBe(true);
  });

  test('切换用户后 HealVision 使用新用户的 token', async ({ page }) => {
    // 用户1 登录
    await loginAs(page, TEST_USERS.normal.email);
    await page.goto('/healvision/');
    await waitForSubAppReady(page);

    const token1 = await page.evaluate(() => localStorage.getItem('pengip_token'));
    expect(token1).not.toBeNull();

    // 用户1 登出
    await page.goto('/');
    await logoutFromNavbar(page);

    // 用户2 登录
    await loginAs(page, TEST_USERS.normal2.email);
    await page.goto('/healvision/');
    await waitForSubAppReady(page);

    const token2 = await page.evaluate(() => localStorage.getItem('pengip_token'));
    expect(token2).not.toBeNull();

    // 两个用户的 token 必须不同
    expect(token1).not.toBe(token2);

    // 子应用正常加载（不是激活页）
    expect(await isShowingActivationPage(page)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// MotionX
// ─────────────────────────────────────────────────────────────────
test.describe('MotionX autoLogin', () => {
  test('主站登录后访问 MotionX → 不出现激活码页面', async ({ page }) => {
    await loginAs(page, TEST_USERS.normal.email);

    await page.goto('/motionx/');
    await waitForSubAppReady(page);

    expect(await isShowingActivationPage(page)).toBe(false);
  });

  test('主站登出后访问 MotionX → 出现激活码页面', async ({ page }) => {
    await loginAs(page, TEST_USERS.normal.email);
    await page.goto('/motionx/');
    await waitForSubAppReady(page);

    await page.goto('/');
    await logoutFromNavbar(page);

    await page.goto('/motionx/');
    await waitForSubAppReady(page);

    expect(await isShowingActivationPage(page)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// PreVSim
// ─────────────────────────────────────────────────────────────────
test.describe('PreVSim autoLogin', () => {
  test('主站登录后访问 PreVSim → 不出现激活码页面', async ({ page }) => {
    await loginAs(page, TEST_USERS.normal.email);

    await page.goto('/prevsim/');
    await waitForSubAppReady(page);

    expect(await isShowingActivationPage(page)).toBe(false);
  });

  test('主站登出后访问 PreVSim → 出现激活码页面', async ({ page }) => {
    await loginAs(page, TEST_USERS.normal.email);
    await page.goto('/prevsim/');
    await waitForSubAppReady(page);

    await page.goto('/');
    await logoutFromNavbar(page);

    await page.goto('/prevsim/');
    await waitForSubAppReady(page);

    expect(await isShowingActivationPage(page)).toBe(true);
  });
});
