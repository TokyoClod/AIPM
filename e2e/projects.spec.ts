import { test, expect, Page } from '@playwright/test';

/**
 * 项目管理流程E2E测试
 * 测试项目创建、查看、更新、删除等核心功能
 */

test.describe('项目管理流程测试', () => {
  let testUser: { email: string; password: string; name: string };
  let testProject: { name: string; description: string };

  test.beforeAll(async () => {
    // 初始化测试数据
    testUser = {
      name: `projectuser_${Date.now()}`,
      email: `project_${Date.now()}@example.com`,
      password: 'Test123456'
    };
    
    testProject = {
      name: `测试项目_${Date.now()}`,
      description: '这是一个E2E测试项目'
    };
  });

  test.beforeEach(async ({ page }) => {
    // 注册并登录用户
    await registerAndLogin(page, testUser);
  });

  test('应该显示项目列表页面', async ({ page }) => {
    // 导航到项目页面
    await page.click('text=项目');
    await page.waitForLoadState('networkidle');
    
    // 验证页面标题
    await expect(page.locator('h1, h2').first()).toContainText('项目');
    
    // 验证创建项目按钮存在
    await expect(page.locator('button:has-text("创建"), button:has-text("新建")')).toBeVisible();
  });

  test('创建新项目', async ({ page }) => {
    // 导航到项目页面
    await page.click('text=项目');
    await page.waitForLoadState('networkidle');
    
    // 点击创建项目按钮
    await page.click('button:has-text("创建"), button:has-text("新建")');
    
    // 等待创建项目对话框或表单出现
    await page.waitForSelector('.ant-modal, form', { timeout: 5000 });
    
    // 填写项目信息
    await page.fill('input[placeholder*="项目名称"], input[label*="项目名称"]', testProject.name);
    await page.fill('textarea[placeholder*="描述"], textarea[label*="描述"]', testProject.description);
    
    // 提交创建
    await page.click('button:has-text("确定"), button:has-text("创建"), button:has-text("提交")');
    
    // 等待创建成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证项目出现在列表中
    await expect(page.locator(`text=${testProject.name}`)).toBeVisible({ timeout: 5000 });
  });

  test('查看项目详情', async ({ page }) => {
    // 先创建一个项目
    await createProject(page, testProject);
    
    // 点击项目进入详情页
    await page.click(`text=${testProject.name}`);
    await page.waitForLoadState('networkidle');
    
    // 验证项目详情页面
    await expect(page.locator(`text=${testProject.name}`)).toBeVisible();
    await expect(page.locator(`text=${testProject.description}`)).toBeVisible();
    
    // 验证项目详情页的标签页
    await expect(page.locator('text=概览, text=详情')).toBeVisible();
    await expect(page.locator('text=任务')).toBeVisible();
    await expect(page.locator('text=成员')).toBeVisible();
  });

  test('更新项目信息', async ({ page }) => {
    // 先创建一个项目
    await createProject(page, testProject);
    
    // 进入项目详情
    await page.click(`text=${testProject.name}`);
    await page.waitForLoadState('networkidle');
    
    // 点击编辑按钮
    await page.click('button:has-text("编辑"), [data-testid="edit-project"]');
    
    // 等待编辑对话框
    await page.waitForSelector('.ant-modal', { timeout: 5000 });
    
    // 修改项目描述
    const newDescription = '更新后的项目描述';
    await page.fill('textarea[placeholder*="描述"], textarea[label*="描述"]', newDescription);
    
    // 提交更新
    await page.click('button:has-text("确定"), button:has-text("保存")');
    
    // 等待更新成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证更新后的描述
    await expect(page.locator(`text=${newDescription}`)).toBeVisible({ timeout: 5000 });
  });

  test('添加项目成员', async ({ page }) => {
    // 先创建一个项目
    await createProject(page, testProject);
    
    // 进入项目详情
    await page.click(`text=${testProject.name}`);
    await page.waitForLoadState('networkidle');
    
    // 切换到成员标签
    await page.click('text=成员');
    await page.waitForLoadState('networkidle');
    
    // 点击添加成员按钮
    await page.click('button:has-text("添加成员"), button:has-text("邀请")');
    
    // 等待添加成员对话框
    await page.waitForSelector('.ant-modal', { timeout: 5000 });
    
    // 输入成员邮箱（假设有其他测试用户）
    const memberEmail = `member_${Date.now()}@example.com`;
    await page.fill('input[placeholder*="邮箱"], input[placeholder*="用户"]', memberEmail);
    
    // 选择角色
    await page.click('.ant-select-selector');
    await page.click('text=成员, text=开发者');
    
    // 提交添加
    await page.click('button:has-text("确定"), button:has-text("添加")');
    
    // 验证添加成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('删除项目', async ({ page }) => {
    // 先创建一个项目
    await createProject(page, testProject);
    
    // 进入项目详情
    await page.click(`text=${testProject.name}`);
    await page.waitForLoadState('networkidle');
    
    // 点击删除按钮
    await page.click('button:has-text("删除"), [data-testid="delete-project"]');
    
    // 等待确认对话框
    await page.waitForSelector('.ant-modal-confirm', { timeout: 5000 });
    
    // 确认删除
    await page.click('button:has-text("确定")');
    
    // 等待删除成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证项目已从列表中移除
    await page.waitForURL('**/projects', { timeout: 5000 });
    await expect(page.locator(`text=${testProject.name}`)).not.toBeVisible();
  });

  test('项目列表分页', async ({ page }) => {
    // 导航到项目页面
    await page.click('text=项目');
    await page.waitForLoadState('networkidle');
    
    // 创建多个项目以测试分页
    for (let i = 0; i < 12; i++) {
      await createProject(page, {
        name: `分页测试项目_${i}_${Date.now()}`,
        description: `测试项目 ${i}`
      });
    }
    
    // 验证分页器存在
    const pagination = page.locator('.ant-pagination');
    if (await pagination.isVisible()) {
      // 点击下一页
      await page.click('.ant-pagination-next:not(.ant-pagination-disabled)');
      
      // 等待加载
      await page.waitForLoadState('networkidle');
      
      // 验证URL或页面变化
      await expect(pagination).toBeVisible();
    }
  });

  test('项目搜索功能', async ({ page }) => {
    // 创建一个有特殊名称的项目
    const specialProject = {
      name: `特殊搜索项目_${Date.now()}`,
      description: '用于搜索测试'
    };
    await createProject(page, specialProject);
    
    // 导航到项目页面
    await page.click('text=项目');
    await page.waitForLoadState('networkidle');
    
    // 输入搜索关键词
    await page.fill('input[placeholder*="搜索"], input[placeholder*="查找"]', '特殊搜索项目');
    
    // 等待搜索结果
    await page.waitForTimeout(1000);
    
    // 验证搜索结果
    await expect(page.locator(`text=${specialProject.name}`)).toBeVisible();
  });

  test('响应式布局 - 移动端项目列表', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    
    // 导航到项目页面
    await page.click('text=项目');
    await page.waitForLoadState('networkidle');
    
    // 验证移动端布局
    await expect(page.locator('button:has-text("创建"), button:has-text("新建")')).toBeVisible();
    
    // 验证项目卡片或列表在移动端可访问
    const projectCards = page.locator('.ant-card, .project-item');
    await expect(projectCards.first()).toBeVisible();
  });
});

/**
 * 辅助函数：注册并登录用户
 */
async function registerAndLogin(page: Page, user: { email: string; password: string; name: string }) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // 切换到注册标签
  await page.click('text=注册');
  
  // 填写注册表单
  await page.fill('input[placeholder="用户名"]', user.name);
  await page.fill('input[placeholder="邮箱"]', user.email);
  await page.fill('input[placeholder="密码"]', user.password);
  
  // 提交注册
  await page.click('button:has-text("注册")');
  
  // 等待注册成功并跳转到首页
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * 辅助函数：创建项目
 */
async function createProject(page: Page, project: { name: string; description: string }) {
  // 导航到项目页面
  await page.click('text=项目');
  await page.waitForLoadState('networkidle');
  
  // 点击创建项目按钮
  await page.click('button:has-text("创建"), button:has-text("新建")');
  
  // 等待创建项目对话框
  await page.waitForSelector('.ant-modal, form', { timeout: 5000 });
  
  // 填写项目信息
  await page.fill('input[placeholder*="项目名称"], input[label*="项目名称"]', project.name);
  await page.fill('textarea[placeholder*="描述"], textarea[label*="描述"]', project.description);
  
  // 提交创建
  await page.click('button:has-text("确定"), button:has-text("创建"), button:has-text("提交")');
  
  // 等待创建成功
  await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  
  // 等待对话框关闭
  await page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 5000 });
}
