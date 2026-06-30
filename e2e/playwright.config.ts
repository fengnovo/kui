import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  // 启动 Storybook 作为渲染源(组件的视觉/交互真相)
  webServer: {
    command: 'pnpm --filter docs storybook -- --ci --quiet -p 6006',
    url: 'http://localhost:6006/iframe.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { STORYBOOK_DISABLE_TELEMETRY: '1' },
  },
  use: { baseURL: 'http://localhost:6006' },
  // 视觉回归:像素 diff 超阈值即拦截
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
});
