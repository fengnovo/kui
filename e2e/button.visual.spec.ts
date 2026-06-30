import { test, expect } from '@playwright/test';

test('Button 各变体视觉快照', async ({ page }) => {
  await page.goto('/iframe.html?id=button--all-variants&viewMode=story');
  await page.waitForSelector('.kui-btn');
  await expect(page).toHaveScreenshot('button-all-variants.png');
});

test('Button 各尺寸视觉快照', async ({ page }) => {
  await page.goto('/iframe.html?id=button--sizes&viewMode=story');
  await page.waitForSelector('.kui-btn');
  await expect(page).toHaveScreenshot('button-sizes.png');
});
