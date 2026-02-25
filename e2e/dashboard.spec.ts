/**
 * dashboard.spec.ts
 * 测试 Dashboard：积分显示、激活年卡、充值积分
 */
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';
import { TEST_USERS, TEST_CODES } from './global-setup';

// 每个测试前先登录
test.beforeEach(async ({ page }) => {
  await loginAs(page, TEST_USERS.normal.email);
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
});

// ─────────────────────────────────────────────────────────────────
// 积分与状态展示
// ─────────────────────────────────────────────────────────────────
test.describe('Dashboard 展示', () => {
  test('积分数字与数据库一致（500）', async ({ page }) => {
    const pts = await page.locator('span.pointsNumber').textContent();
    expect(Number(pts?.trim())).toBe(TEST_USERS.normal.points);
  });

  test('有年卡用户显示「年卡有效」', async ({ page }) => {
    await expect(page.locator('.subBadgeActive')).toContainText('年卡有效');
  });

  test('积分记录区域可展开', async ({ page }) => {
    await page.locator('button', { hasText: '积分记录' }).click();
    await expect(page.locator('h2', { hasText: '积分记录' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// 激活年卡码
// ─────────────────────────────────────────────────────────────────
test.describe('激活年卡码', () => {
  test('无年卡用户激活年卡码 → 订阅生效，+1000 积分', async ({ page }) => {
    // 换用「无年卡」账号
    await loginAs(page, TEST_USERS.nosub.email);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 确认当前无年卡
    await expect(page.locator('.subBadgeActive')).not.toBeVisible();

    // 填入年卡码
    await page.fill('#activateInput', TEST_CODES.annual);
    await page.locator('.activateBtn').click();

    // 等待成功 Toast
    await expect(page.locator('.toast.success, .toast')).toBeVisible({ timeout: 8000 });

    // 年卡标识出现
    await expect(page.locator('.subBadgeActive')).toContainText('年卡有效', { timeout: 5000 });

    // 积分增加了 1000（首次激活奖励）：500 + 1000 = 1500
    const pts = await page.locator('span.pointsNumber').textContent();
    expect(Number(pts?.trim())).toBe(TEST_USERS.nosub.points + 1000);
  });

  test('已使用的激活码 → 提示错误', async ({ page }) => {
    await page.fill('#activateInput', TEST_CODES.used);
    await page.locator('.activateBtn').click();

    await expect(page.locator('.toast.error, .error, .toast')).toBeVisible({ timeout: 5000 });
  });

  test('不存在的激活码 → 提示错误', async ({ page }) => {
    await page.fill('#activateInput', 'FAKE-FAKE-FAKE-9999');
    await page.locator('.activateBtn').click();

    await expect(page.locator('.toast.error, .error, .toast')).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// 充值积分码
// ─────────────────────────────────────────────────────────────────
test.describe('充值积分码', () => {
  test('充值码兑换 → 积分增加 500', async ({ page }) => {
    const ptsBefore = Number((await page.locator('span.pointsNumber').textContent())?.trim());

    await page.fill('#activateInput', TEST_CODES.recharge);
    await page.locator('.activateBtn').click();

    await expect(page.locator('.toast.success, .toast')).toBeVisible({ timeout: 8000 });

    const ptsAfter = Number((await page.locator('span.pointsNumber').textContent())?.trim());
    expect(ptsAfter).toBe(ptsBefore + 500);
  });
});
