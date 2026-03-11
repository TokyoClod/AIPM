import { test, expect } from '@playwright/test';
import { waitForStablePage } from '../helpers/visual';

test.describe('登录页视觉测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await waitForStablePage(page);
  });

  test('登录页 - 桌面端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('login-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('登录页 - 平板端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('login-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('登录页 - 移动端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('登录表单 - 默认状态', async ({ page }, testInfo) => {
    const loginForm = page.locator('form, .login-form, .auth-form').first();
    
    if (await loginForm.isVisible()) {
      await expect(loginForm).toHaveScreenshot('login-form-default.png', {
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('登录表单 - 输入状态', async ({ page }, testInfo) => {
    const emailInput = page.locator('input[placeholder="邮箱"], input[type="email"]').first();
    const passwordInput = page.locator('input[placeholder="密码"], input[type="password"]').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.waitForTimeout(300);
    }
    
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password123');
      await page.waitForTimeout(300);
    }
    
    const loginForm = page.locator('form, .login-form, .auth-form').first();
    
    if (await loginForm.isVisible()) {
      await expect(loginForm).toHaveScreenshot('login-form-filled.png', {
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('登录表单 - 错误状态', async ({ page }, testInfo) => {
    const submitButton = page.locator('button:has-text("登录")').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
    }
    
    const loginForm = page.locator('form, .login-form, .auth-form').first();
    
    if (await loginForm.isVisible()) {
      await expect(loginForm).toHaveScreenshot('login-form-error.png', {
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('注册标签', async ({ page }, testInfo) => {
    const registerTab = page.locator('text=注册').first();
    
    if (await registerTab.isVisible()) {
      await registerTab.click();
      await waitForStablePage(page);
      
      await expect(page).toHaveScreenshot('register-tab.png', {
        fullPage: true,
        maxDiffPixels: 100,
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});
