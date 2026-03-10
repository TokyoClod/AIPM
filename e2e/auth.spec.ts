import { test, expect, Page } from '@playwright/test';

/**
 * 认证流程E2E测试
 * 测试用户注册、登录、登出等核心认证功能
 */

test.describe('认证流程测试', () => {
  // 测试用户数据
  const testUser = {
    name: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456'
  };

  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('应该显示登录页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('h2')).toContainText('AIPM 项目管理平台');
    
    // 验证登录表单存在
    await expect(page.locator('text=登录')).toBeVisible();
    await expect(page.locator('text=注册')).toBeVisible();
  });

  test('用户注册流程', async ({ page }) => {
    // 切换到注册标签
    await page.click('text=注册');
    
    // 填写注册表单
    await page.fill('input[placeholder="用户名"]', testUser.name);
    await page.fill('input[placeholder="邮箱"]', testUser.email);
    await page.fill('input[placeholder="密码"]', testUser.password);
    
    // 提交注册
    await page.click('button:has-text("注册")');
    
    // 等待注册成功并跳转到首页
    await page.waitForURL('/', { timeout: 10000 });
    
    // 验证跳转到仪表盘
    await expect(page).toHaveURL('/');
    
    // 验证成功消息
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('用户登录流程', async ({ page }) => {
    // 确保在登录标签
    await page.click('text=登录');
    
    // 填写登录表单
    await page.fill('input[placeholder="邮箱"]', testUser.email);
    await page.fill('input[placeholder="密码"]', testUser.password);
    
    // 提交登录
    await page.click('button:has-text("登录")');
    
    // 等待登录成功并跳转到首页
    await page.waitForURL('/', { timeout: 10000 });
    
    // 验证跳转到仪表盘
    await expect(page).toHaveURL('/');
    
    // 验证成功消息
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('登录失败 - 错误的密码', async ({ page }) => {
    // 填写登录表单
    await page.fill('input[placeholder="邮箱"]', testUser.email);
    await page.fill('input[placeholder="密码"]', 'wrongpassword');
    
    // 提交登录
    await page.click('button:has-text("登录")');
    
    // 验证错误消息
    await expect(page.locator('.ant-message-error')).toBeVisible({ timeout: 5000 });
    
    // 验证仍在登录页面
    await expect(page).toHaveURL('/login');
  });

  test('登录失败 - 无效邮箱格式', async ({ page }) => {
    // 切换到注册标签
    await page.click('text=注册');
    
    // 填写无效邮箱
    await page.fill('input[placeholder="用户名"]', 'testuser');
    await page.fill('input[placeholder="邮箱"]', 'invalid-email');
    await page.fill('input[placeholder="密码"]', 'Test123456');
    
    // 提交注册
    await page.click('button:has-text("注册")');
    
    // 验证表单验证错误
    await expect(page.locator('text=请输入有效邮箱')).toBeVisible();
  });

  test('表单验证 - 必填字段', async ({ page }) => {
    // 尝试提交空表单
    await page.click('button:has-text("登录")');
    
    // 验证表单验证错误
    await expect(page.locator('text=请输入邮箱')).toBeVisible();
    await expect(page.locator('text=请输入密码')).toBeVisible();
  });

  test('表单验证 - 密码长度', async ({ page }) => {
    // 切换到注册标签
    await page.click('text=注册');
    
    // 填写短密码
    await page.fill('input[placeholder="用户名"]', 'testuser');
    await page.fill('input[placeholder="邮箱"]', 'test@example.com');
    await page.fill('input[placeholder="密码"]', '123');
    
    // 提交注册
    await page.click('button:has-text("注册")');
    
    // 验证密码长度错误
    await expect(page.locator('text=密码至少6位')).toBeVisible();
  });

  test('用户登出流程', async ({ page }) => {
    // 先登录
    await loginAsUser(page, testUser.email, testUser.password);
    
    // 等待跳转到首页
    await page.waitForURL('/');
    
    // 点击用户菜单（假设有一个用户头像或菜单按钮）
    await page.click('.anticon-user, [data-testid="user-menu"], .user-avatar');
    
    // 点击登出按钮
    await page.click('text=登出, text=退出登录');
    
    // 验证跳转到登录页面
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });

  test('未登录用户访问受保护页面应重定向到登录页', async ({ page }) => {
    // 清除所有存储
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // 尝试访问受保护的路由
    await page.goto('/projects');
    
    // 验证重定向到登录页面
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });

  test('登录后访问仪表盘', async ({ page }) => {
    // 登录
    await loginAsUser(page, testUser.email, testUser.password);
    
    // 等待跳转到首页
    await page.waitForURL('/');
    
    // 验证仪表盘元素
    await expect(page.locator('text=仪表盘, text=Dashboard')).toBeVisible({ timeout: 5000 });
    
    // 验证侧边栏导航
    await expect(page.locator('text=项目')).toBeVisible();
    await expect(page.locator('text=任务')).toBeVisible();
    await expect(page.locator('text=风险')).toBeVisible();
  });

  test('响应式布局 - 移动端登录页面', async ({ page, isMobile }) => {
    // 跳过非移动端测试
    if (!isMobile) {
      test.skip();
      return;
    }
    
    // 验证移动端布局
    const authCard = page.locator('.auth-card');
    await expect(authCard).toBeVisible();
    
    // 验证表单在移动端可访问
    await expect(page.locator('input[placeholder="邮箱"]')).toBeVisible();
    await expect(page.locator('input[placeholder="密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
  });
});

/**
 * 辅助函数：登录用户
 */
async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // 确保在登录标签
  await page.click('text=登录');
  
  // 填写登录表单
  await page.fill('input[placeholder="邮箱"]', email);
  await page.fill('input[placeholder="密码"]', password);
  
  // 提交登录
  await page.click('button:has-text("登录")');
  
  // 等待登录成功
  await page.waitForURL('/', { timeout: 10000 });
}
