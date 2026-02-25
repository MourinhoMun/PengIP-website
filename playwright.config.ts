import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false, // 共享数据库，顺序执行避免竞争
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'e2e/report' }],
    ['line'],
  ],
  use: {
    // 默认跑生产站，本地测试用: BASE_URL=http://localhost:3000 npx playwright test
    baseURL: process.env.BASE_URL || 'https://pengip.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
