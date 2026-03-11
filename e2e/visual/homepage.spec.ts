import { test, expect } from '@playwright/test';
import { waitForStablePage, takeScreenshot } from '../helpers/visual';

test.describe('首页视觉测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForStablePage(page);
  });

  test('首页 - 桌面端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('首页 - 平板端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('首页 - 移动端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('首页 - 导航栏', async ({ page }, testInfo) => {
    const navbar = page.locator('nav, .navbar, .ant-layout-header').first();
    
    if (await navbar.isVisible()) {
      await expect(navbar).toHaveScreenshot('homepage-navbar.png', {
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('首页 - 侧边栏', async ({ page }, testInfo) => {
    const sidebar = page.locator('aside, .sidebar, .ant-layout-sider').first();
    
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('homepage-sidebar.png', {
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('首页 - 内容区域', async ({ page }, testInfo) => {
    const content = page.locator('main, .content, .ant-layout-content').first();
    
    if (await content.isVisible()) {
      await expect(content).toHaveScreenshot('homepage-content.png', {
        maxDiffPixels: 100,
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});
