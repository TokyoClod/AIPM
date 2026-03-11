import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../.auth/user.json');

const testUser = {
  name: `setup_user_${Date.now()}`,
  email: `setup_${Date.now()}@example.com`,
  password: 'Test123456'
};

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.click('text=注册');
  await page.fill('input[placeholder="用户名"]', testUser.name);
  await page.fill('input[placeholder="邮箱地址"]', testUser.email);
  await page.fill('input[placeholder="设置密码"]', testUser.password);
  await page.click('button:has-text("创建账号")');
  
  await page.waitForURL('/', { timeout: 10000 });
  
  await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  await page.context().storageState({ path: authFile });
});
