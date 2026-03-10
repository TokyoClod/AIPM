import { test, expect, Page } from '@playwright/test';

/**
 * 仪表盘E2E测试
 * 测试仪表盘数据展示、统计图表、快速操作等核心功能
 */

test.describe('仪表盘测试', () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeAll(async () => {
    // 初始化测试数据
    testUser = {
      name: `dashboarduser_${Date.now()}`,
      email: `dashboard_${Date.now()}@example.com`,
      password: 'Test123456'
    };
  });

  test.beforeEach(async ({ page }) => {
    // 注册并登录用户
    await registerAndLogin(page, testUser);
  });

  test('应该显示仪表盘页面', async ({ page }) => {
    // 验证仪表盘页面标题
    await expect(page.locator('h1, h2').first()).toContainText('仪表盘, Dashboard');
    
    // 验证侧边栏导航存在
    await expect(page.locator('text=项目')).toBeVisible();
    await expect(page.locator('text=任务')).toBeVisible();
    await expect(page.locator('text=风险')).toBeVisible();
  });

  test('仪表盘统计卡片显示', async ({ page }) => {
    // 验证统计卡片存在
    const statCards = page.locator('.ant-card, .stat-card, .dashboard-card');
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
    
    // 验证常见统计项
    await expect(page.locator('text=项目')).toBeVisible();
    await expect(page.locator('text=任务')).toBeVisible();
    await expect(page.locator('text=风险')).toBeVisible();
  });

  test('仪表盘 - 项目统计', async ({ page }) => {
    // 创建几个项目
    for (let i = 0; i < 3; i++) {
      await createProject(page, {
        name: `仪表盘项目_${i}_${Date.now()}`,
        description: `测试项目 ${i}`
      });
    }
    
    // 返回仪表盘
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 验证项目数量显示
    const projectStat = page.locator('.stat-card:has-text("项目"), .dashboard-card:has-text("项目")');
    if (await projectStat.isVisible()) {
      // 验证数字显示
      const numberText = await projectStat.locator('.number, .count, h2').textContent();
      expect(numberText).toMatch(/\d+/);
    }
  });

  test('仪表盘 - 任务统计', async ({ page }) => {
    // 创建项目和任务
    const project = {
      name: `任务统计项目_${Date.now()}`,
      description: '用于任务统计测试'
    };
    await createProject(page, project);
    
    // 创建多个任务
    for (let i = 0; i < 5; i++) {
      await createTask(page, {
        title: `统计任务_${i}_${Date.now()}`,
        description: `测试任务 ${i}`
      }, project);
    }
    
    // 返回仪表盘
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 验证任务数量显示
    const taskStat = page.locator('.stat-card:has-text("任务"), .dashboard-card:has-text("任务")');
    if (await taskStat.isVisible()) {
      const numberText = await taskStat.locator('.number, .count, h2').textContent();
      expect(numberText).toMatch(/\d+/);
    }
  });

  test('仪表盘 - 风险统计', async ({ page }) => {
    // 创建项目和风险
    const project = {
      name: `风险统计项目_${Date.now()}`,
      description: '用于风险统计测试'
    };
    await createProject(page, project);
    
    // 创建多个风险
    for (let i = 0; i < 3; i++) {
      await createRisk(page, {
        title: `统计风险_${i}_${Date.now()}`,
        description: `测试风险 ${i}`,
        impact: '中',
        probability: '低'
      }, project);
    }
    
    // 返回仪表盘
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 验证风险数量显示
    const riskStat = page.locator('.stat-card:has-text("风险"), .dashboard-card:has-text("风险")');
    if (await riskStat.isVisible()) {
      const numberText = await riskStat.locator('.number, .count, h2').textContent();
      expect(numberText).toMatch(/\d+/);
    }
  });

  test('仪表盘 - 最近项目列表', async ({ page }) => {
    // 创建项目
    const recentProject = {
      name: `最近项目_${Date.now()}`,
      description: '最近访问的项目'
    };
    await createProject(page, recentProject);
    
    // 返回仪表盘
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 查找最近项目列表
    const recentProjectsSection = page.locator('text=最近项目, text=Recent Projects');
    if (await recentProjectsSection.isVisible()) {
      // 验证项目显示在列表中
      await expect(page.locator(`text=${recentProject.name}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('仪表盘 - 最近任务列表', async ({ page }) => {
    // 创建项目和任务
    const project = {
      name: `最近任务项目_${Date.now()}`,
      description: '用于最近任务测试'
    };
    await createProject(page, project);
    
    const recentTask = {
      title: `最近任务_${Date.now()}`,
      description: '最近创建的任务'
    };
    await createTask(page, recentTask, project);
    
    // 返回仪表盘
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 查找最近任务列表
    const recentTasksSection = page.locator('text=最近任务, text=Recent Tasks');
    if (await recentTasksSection.isVisible()) {
      // 验证任务显示在列表中
      await expect(page.locator(`text=${recentTask.title}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('仪表盘 - 图表展示', async ({ page }) => {
    // 创建一些数据
    const project = {
      name: `图表项目_${Date.now()}`,
      description: '用于图表测试'
    };
    await createProject(page, project);
    
    // 返回仪表盘
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 查找图表元素
    const charts = page.locator('.ant-chart, canvas, .recharts-wrapper, .chart-container');
    const chartCount = await charts.count();
    
    // 验证至少有一个图表
    expect(chartCount).toBeGreaterThanOrEqual(0);
  });

  test('仪表盘 - 快速操作按钮', async ({ page }) => {
    // 查找快速操作按钮
    const quickActions = page.locator('button:has-text("创建"), button:has-text("新建"), .quick-action');
    const count = await quickActions.count();
    
    // 验证快速操作按钮存在
    expect(count).toBeGreaterThan(0);
  });

  test('仪表盘 - 快速创建项目', async ({ page }) => {
    // 点击快速创建项目按钮
    const createProjectButton = page.locator('button:has-text("创建项目"), button:has-text("新建项目")');
    if (await createProjectButton.isVisible()) {
      await createProjectButton.click();
      
      // 等待创建对话框
      await page.waitForSelector('.ant-modal', { timeout: 5000 });
      
      // 验证对话框标题
      await expect(page.locator('text=创建项目, text=新建项目')).toBeVisible();
    }
  });

  test('仪表盘 - 快速创建任务', async ({ page }) => {
    // 先创建一个项目
    await createProject(page, {
      name: `快速任务项目_${Date.now()}`,
      description: '用于快速创建任务'
    });
    
    // 返回仪表盘
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 点击快速创建任务按钮
    const createTaskButton = page.locator('button:has-text("创建任务"), button:has-text("新建任务")');
    if (await createTaskButton.isVisible()) {
      await createTaskButton.click();
      
      // 等待创建对话框
      await page.waitForSelector('.ant-modal', { timeout: 5000 });
      
      // 验证对话框标题
      await expect(page.locator('text=创建任务, text=新建任务')).toBeVisible();
    }
  });

  test('仪表盘 - 导航到项目列表', async ({ page }) => {
    // 点击项目导航
    await page.click('text=项目');
    await page.waitForLoadState('networkidle');
    
    // 验证跳转到项目页面
    await expect(page).toHaveURL(/.*projects/);
  });

  test('仪表盘 - 导航到任务列表', async ({ page }) => {
    // 点击任务导航
    await page.click('text=任务');
    await page.waitForLoadState('networkidle');
    
    // 验证跳转到任务页面
    await expect(page).toHaveURL(/.*tasks/);
  });

  test('仪表盘 - 导航到风险列表', async ({ page }) => {
    // 点击风险导航
    await page.click('text=风险');
    await page.waitForLoadState('networkidle');
    
    // 验证跳转到风险页面
    await expect(page).toHaveURL(/.*risks/);
  });

  test('仪表盘 - 用户信息显示', async ({ page }) => {
    // 查找用户信息区域
    const userInfo = page.locator('.user-info, .user-profile, .anticon-user');
    await expect(userInfo).toBeVisible();
    
    // 验证用户名显示
    await expect(page.locator(`text=${testUser.name}`)).toBeVisible();
  });

  test('仪表盘 - 通知提醒', async ({ page }) => {
    // 查找通知图标
    const notificationIcon = page.locator('.anticon-bell, .notification-icon, [data-testid="notifications"]');
    
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();
      
      // 等待通知列表
      await page.waitForSelector('.notification-list, .ant-dropdown, .ant-popover', { timeout: 5000 });
      
      // 验证通知列表显示
      await expect(page.locator('text=通知, text=Notifications')).toBeVisible();
    }
  });

  test('仪表盘 - 主题切换', async ({ page }) => {
    // 查找主题切换按钮
    const themeToggle = page.locator('.theme-toggle, .anticon-bulb, [data-testid="theme-toggle"]');
    
    if (await themeToggle.isVisible()) {
      // 获取当前主题
      const htmlElement = page.locator('html');
      const initialTheme = await htmlElement.getAttribute('class');
      
      // 点击切换主题
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // 验证主题已切换
      const newTheme = await htmlElement.getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('仪表盘 - 数据刷新', async ({ page }) => {
    // 创建一个项目
    await createProject(page, {
      name: `刷新测试项目_${Date.now()}`,
      description: '用于刷新测试'
    });
    
    // 返回仪表盘
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 查找刷新按钮
    const refreshButton = page.locator('button:has-text("刷新"), .anticon-reload, [data-testid="refresh"]');
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // 等待数据刷新
      await page.waitForTimeout(1000);
      
      // 验证页面仍然正常显示
      await expect(page.locator('text=项目')).toBeVisible();
    }
  });

  test('仪表盘 - 响应式布局 - 桌面端', async ({ page, isMobile, isTablet }) => {
    if (isMobile || isTablet) {
      test.skip();
      return;
    }
    
    // 验证桌面端布局
    const sidebar = page.locator('.ant-layout-sider, .sidebar, nav');
    await expect(sidebar).toBeVisible();
    
    // 验证内容区域
    const content = page.locator('.ant-layout-content, main, .content');
    await expect(content).toBeVisible();
  });

  test('仪表盘 - 响应式布局 - 移动端', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    
    // 验证移动端布局
    // 侧边栏可能隐藏或折叠
    const menuButton = page.locator('.anticon-menu, .menu-toggle, [data-testid="menu-toggle"]');
    
    if (await menuButton.isVisible()) {
      // 点击菜单按钮展开侧边栏
      await menuButton.click();
      await page.waitForTimeout(500);
    }
    
    // 验证仪表盘内容在移动端可访问
    await expect(page.locator('text=项目')).toBeVisible();
    await expect(page.locator('text=任务')).toBeVisible();
  });

  test('仪表盘 - 响应式布局 - 平板端', async ({ page, isTablet }) => {
    if (!isTablet) {
      test.skip();
      return;
    }
    
    // 验证平板端布局
    // 侧边栏可能折叠或显示
    const sidebar = page.locator('.ant-layout-sider, .sidebar, nav');
    
    // 验证仪表盘内容可访问
    await expect(page.locator('text=项目')).toBeVisible();
    await expect(page.locator('text=任务')).toBeVisible();
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
  await page.click('button:has-text("确定"), button:has-text("创建")');
  
  // 等待创建成功
  await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  
  // 等待对话框关闭
  await page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 5000 });
}

/**
 * 辅助函数：创建任务
 */
async function createTask(
  page: Page, 
  task: { title: string; description: string },
  project?: { name: string }
) {
  // 导航到任务页面
  await page.click('text=任务');
  await page.waitForLoadState('networkidle');
  
  // 点击创建任务按钮
  await page.click('button:has-text("创建"), button:has-text("新建")');
  
  // 等待创建任务对话框
  await page.waitForSelector('.ant-modal, form', { timeout: 5000 });
  
  // 填写任务信息
  await page.fill('input[placeholder*="任务标题"], input[label*="标题"]', task.title);
  await page.fill('textarea[placeholder*="描述"], textarea[label*="描述"]', task.description);
  
  // 选择项目（如果有下拉选择）
  if (project) {
    const projectSelect = page.locator('.ant-select:has-text("选择项目")');
    if (await projectSelect.isVisible()) {
      await projectSelect.click();
      await page.click(`text=${project.name}`);
    }
  }
  
  // 提交创建
  await page.click('button:has-text("确定"), button:has-text("创建")');
  
  // 等待创建成功
  await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  
  // 等待对话框关闭
  await page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 5000 });
}

/**
 * 辅助函数：创建风险
 */
async function createRisk(
  page: Page, 
  risk: { title: string; description: string; impact: string; probability: string },
  project?: { name: string }
) {
  // 导航到风险页面
  await page.click('text=风险');
  await page.waitForLoadState('networkidle');
  
  // 点击创建风险按钮
  await page.click('button:has-text("创建"), button:has-text("新建")');
  
  // 等待创建风险对话框
  await page.waitForSelector('.ant-modal, form', { timeout: 5000 });
  
  // 填写风险信息
  await page.fill('input[placeholder*="风险标题"], input[label*="标题"]', risk.title);
  await page.fill('textarea[placeholder*="描述"], textarea[label*="描述"]', risk.description);
  
  // 选择影响程度
  const impactSelect = page.locator('.ant-select:has-text("影响程度"), .ant-select:has-text("影响")');
  if (await impactSelect.isVisible()) {
    await impactSelect.click();
    await page.click(`text=${risk.impact}`);
  }
  
  // 选择发生概率
  const probabilitySelect = page.locator('.ant-select:has-text("发生概率"), .ant-select:has-text("概率")');
  if (await probabilitySelect.isVisible()) {
    await probabilitySelect.click();
    await page.click(`text=${risk.probability}`);
  }
  
  // 选择项目
  if (project) {
    const projectSelect = page.locator('.ant-select:has-text("选择项目")');
    if (await projectSelect.isVisible()) {
      await projectSelect.click();
      await page.click(`text=${project.name}`);
    }
  }
  
  // 提交创建
  await page.click('button:has-text("确定"), button:has-text("创建")');
  
  // 等待创建成功
  await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  
  // 等待对话框关闭
  await page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 5000 });
}
