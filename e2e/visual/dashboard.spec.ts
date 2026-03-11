import { test, expect } from '@playwright/test';
import { waitForStablePage } from '../helpers/visual';

test.describe('仪表盘视觉测试', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test123456'
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await waitForStablePage(page);
    
    const emailInput = page.locator('input[placeholder="邮箱"], input[type="email"]').first();
    const passwordInput = page.locator('input[placeholder="密码"], input[type="password"]').first();
    const loginButton = page.locator('button:has-text("登录")').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill(testUser.email);
      await passwordInput.fill(testUser.password);
      await loginButton.click();
      
      await page.waitForURL('/', { timeout: 10000 });
      await waitForStablePage(page);
    }
  });

  test('仪表盘 - 桌面端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('仪表盘 - 平板端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('仪表盘 - 移动端', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForStablePage(page);
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('仪表盘 - 统计卡片', async ({ page }, testInfo) => {
    const statCards = page.locator('.stat-card, .ant-card, [class*="statistic"]').first();
    
    if (await statCards.isVisible()) {
      await expect(statCards).toHaveScreenshot('dashboard-stat-cards.png', {
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('仪表盘 - 图表区域', async ({ page }, testInfo) => {
    const charts = page.locator('canvas, .chart, [class*="chart"]').first();
    
    if (await charts.isVisible()) {
      await expect(charts).toHaveScreenshot('dashboard-charts.png', {
        maxDiffPixels: 100,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('仪表盘 - 任务列表', async ({ page }, testInfo) => {
    const taskList = page.locator('.task-list, .ant-list, [class*="task"]').first();
    
    if (await taskList.isVisible()) {
      await expect(taskList).toHaveScreenshot('dashboard-task-list.png', {
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('仪表盘 - 侧边栏展开', async ({ page }, testInfo) => {
    const sidebar = page.locator('aside, .sidebar, .ant-layout-sider').first();
    
    if (await sidebar.isVisible()) {
      const collapsed = await sidebar.getAttribute('class');
      
      if (collapsed?.includes('collapsed')) {
        const trigger = page.locator('.ant-layout-sider-trigger, .sidebar-trigger').first();
        if (await trigger.isVisible()) {
          await trigger.click();
          await page.waitForTimeout(300);
        }
      }
      
      await expect(sidebar).toHaveScreenshot('dashboard-sidebar-expanded.png', {
        maxDiffPixels: 50,
        maxDiffPixelRatio: 0.01,
      });
    }
  });

  test('仪表盘 - 侧边栏折叠', async ({ page }, testInfo) => {
    const sidebar = page.locator('aside, .sidebar, .ant-layout-sider').first();
    
    if (await sidebar.isVisible()) {
      const trigger = page.locator('.ant-layout-sider-trigger, .sidebar-trigger').first();
      
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(300);
        
        await expect(sidebar).toHaveScreenshot('dashboard-sidebar-collapsed.png', {
          maxDiffPixels: 50,
          maxDiffPixelRatio: 0.01,
        });
      }
    }
  });

  test('仪表盘 - 用户菜单', async ({ page }, testInfo) => {
    const userMenu = page.locator('.user-menu, .anticon-user, [data-testid="user-menu"]').first();
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(300);
      
      const dropdown = page.locator('.ant-dropdown, .user-dropdown').first();
      
      if (await dropdown.isVisible()) {
        await expect(dropdown).toHaveScreenshot('dashboard-user-menu.png', {
          maxDiffPixels: 50,
          maxDiffPixelRatio: 0.01,
        });
      }
    }
  });
});
