import { test, expect } from '@playwright/test';

test('Select 键盘全流程:ArrowDown 开 → 高亮 → Enter 选中(跳过 disabled)', async ({ page }) => {
  await page.goto('/iframe.html?id=select--default&viewMode=story');
  const trigger = page.getByRole('combobox');
  await trigger.focus();

  await page.keyboard.press('ArrowDown'); // 打开
  await expect(page.getByRole('listbox')).toBeVisible();

  await page.keyboard.press('ArrowDown'); // 高亮第一个可用项(Apple,跳过 disabled 的逻辑在内核)
  // aria-activedescendant 指向真实存在的高亮节点(时序正确性)
  const activeId = await trigger.getAttribute('aria-activedescendant');
  expect(activeId).toBeTruthy();
  // useId 生成的 id 含冒号(:r0:),用属性选择器避免 CSS 转义问题
  await expect(page.locator(`[id="${activeId}"]`)).toHaveText('Apple');

  await page.keyboard.press('Enter'); // 选中并关闭
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(trigger).toHaveText('Apple');
});

test('Select disabled 项不可选', async ({ page }) => {
  await page.goto('/iframe.html?id=select--default&viewMode=story');
  await page.getByRole('combobox').click();
  // force:绕过 Playwright 对 aria-disabled 的可操作性拦截,验证 onClick 内核守卫确实 no-op
  await page.getByRole('option', { name: 'Banana' }).click({ force: true });
  // 点击 disabled 项:列表不关、未选中
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(page.getByRole('combobox')).not.toHaveText('Banana');
});

test('Select 打开态视觉快照', async ({ page }) => {
  await page.goto('/iframe.html?id=select--default&viewMode=story');
  await page.getByRole('combobox').click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(page).toHaveScreenshot('select-open.png');
});
