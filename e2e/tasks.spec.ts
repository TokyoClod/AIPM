import { test, expect, Page } from '@playwright/test';

/**
 * 任务管理流程E2E测试
 * 测试任务创建、分配、更新进度、状态变更等核心功能
 */

test.describe('任务管理流程测试', () => {
  let testUser: { email: string; password: string; name: string };
  let testProject: { name: string; description: string };
  let testTask: { title: string; description: string };

  test.beforeAll(async () => {
    // 初始化测试数据
    testUser = {
      name: `taskuser_${Date.now()}`,
      email: `task_${Date.now()}@example.com`,
      password: 'Test123456'
    };
    
    testProject = {
      name: `任务测试项目_${Date.now()}`,
      description: '用于任务测试的项目'
    };
    
    testTask = {
      title: `测试任务_${Date.now()}`,
      description: '这是一个E2E测试任务'
    };
  });

  test.beforeEach(async ({ page }) => {
    // 注册并登录用户
    await registerAndLogin(page, testUser);
    
    // 创建测试项目
    await createProject(page, testProject);
  });

  test('应该显示任务列表页面', async ({ page }) => {
    // 导航到任务页面
    await page.click('text=任务');
    await page.waitForLoadState('networkidle');
    
    // 验证页面标题
    await expect(page.locator('h1, h2').first()).toContainText('任务');
    
    // 验证创建任务按钮存在
    await expect(page.locator('button:has-text("创建"), button:has-text("新建")')).toBeVisible();
  });

  test('创建新任务', async ({ page }) => {
    // 导航到任务页面
    await page.click('text=任务');
    await page.waitForLoadState('networkidle');
    
    // 点击创建任务按钮
    await page.click('button:has-text("创建"), button:has-text("新建")');
    
    // 等待创建任务对话框
    await page.waitForSelector('.ant-modal, form', { timeout: 5000 });
    
    // 填写任务信息
    await page.fill('input[placeholder*="任务标题"], input[label*="标题"]', testTask.title);
    await page.fill('textarea[placeholder*="描述"], textarea[label*="描述"]', testTask.description);
    
    // 选择项目（如果有下拉选择）
    const projectSelect = page.locator('.ant-select:has-text("选择项目")');
    if (await projectSelect.isVisible()) {
      await projectSelect.click();
      await page.click(`text=${testProject.name}`);
    }
    
    // 设置优先级
    const prioritySelect = page.locator('.ant-select:has-text("优先级")');
    if (await prioritySelect.isVisible()) {
      await prioritySelect.click();
      await page.click('text=高');
    }
    
    // 提交创建
    await page.click('button:has-text("确定"), button:has-text("创建")');
    
    // 等待创建成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证任务出现在列表中
    await expect(page.locator(`text=${testTask.title}`)).toBeVisible({ timeout: 5000 });
  });

  test('查看任务详情', async ({ page }) => {
    // 先创建一个任务
    await createTask(page, testTask, testProject);
    
    // 点击任务进入详情页
    await page.click(`text=${testTask.title}`);
    await page.waitForLoadState('networkidle');
    
    // 验证任务详情页面
    await expect(page.locator(`text=${testTask.title}`)).toBeVisible();
    await expect(page.locator(`text=${testTask.description}`)).toBeVisible();
    
    // 验证任务详情页的元素
    await expect(page.locator('text=状态')).toBeVisible();
    await expect(page.locator('text=优先级')).toBeVisible();
    await expect(page.locator('text=负责人')).toBeVisible();
  });

  test('更新任务状态', async ({ page }) => {
    // 先创建一个任务
    await createTask(page, testTask, testProject);
    
    // 点击任务进入详情页
    await page.click(`text=${testTask.title}`);
    await page.waitForLoadState('networkidle');
    
    // 点击状态选择器
    await page.click('.ant-select:has-text("待办"), .ant-select:has-text("进行中")');
    
    // 选择新状态
    await page.click('text=进行中');
    
    // 等待更新成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证状态已更新
    await expect(page.locator('text=进行中')).toBeVisible();
  });

  test('更新任务进度', async ({ page }) => {
    // 先创建一个任务
    await createTask(page, testTask, testProject);
    
    // 点击任务进入详情页
    await page.click(`text=${testTask.title}`);
    await page.waitForLoadState('networkidle');
    
    // 查找进度输入框或滑块
    const progressInput = page.locator('input[type="number"], input[placeholder*="进度"]');
    if (await progressInput.isVisible()) {
      await progressInput.fill('50');
      await progressInput.press('Enter');
      
      // 等待更新成功
      await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    }
    
    // 或者使用进度条
    const progressSlider = page.locator('.ant-slider');
    if (await progressSlider.isVisible()) {
      // 拖动进度条到50%
      const slider = await progressSlider.boundingBox();
      if (slider) {
        await page.mouse.move(slider.x + slider.width * 0.5, slider.y + slider.height / 2);
        await page.mouse.down();
        await page.mouse.up();
      }
    }
  });

  test('分配任务给成员', async ({ page }) => {
    // 先创建一个任务
    await createTask(page, testTask, testProject);
    
    // 点击任务进入详情页
    await page.click(`text=${testTask.title}`);
    await page.waitForLoadState('networkidle');
    
    // 点击负责人选择器
    await page.click('.ant-select:has-text("负责人"), .ant-select:has-text("分配")');
    
    // 选择成员
    await page.click(`text=${testUser.name}`);
    
    // 等待更新成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证负责人已更新
    await expect(page.locator(`text=${testUser.name}`)).toBeVisible();
  });

  test('设置任务截止日期', async ({ page }) => {
    // 先创建一个任务
    await createTask(page, testTask, testProject);
    
    // 点击任务进入详情页
    await page.click(`text=${testTask.title}`);
    await page.waitForLoadState('networkidle');
    
    // 点击日期选择器
    await page.click('.ant-picker, input[placeholder*="日期"]');
    
    // 选择日期（选择明天的日期）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.getDate().toString();
    
    await page.click(`.ant-picker-cell:has-text("${dateStr}")`);
    
    // 等待更新成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('添加任务评论', async ({ page }) => {
    // 先创建一个任务
    await createTask(page, testTask, testProject);
    
    // 点击任务进入详情页
    await page.click(`text=${testTask.title}`);
    await page.waitForLoadState('networkidle');
    
    // 切换到评论标签
    await page.click('text=评论');
    
    // 输入评论内容
    const comment = '这是一个测试评论';
    await page.fill('textarea[placeholder*="评论"], textarea[placeholder*="输入"]', comment);
    
    // 提交评论
    await page.click('button:has-text("发送"), button:has-text("提交")');
    
    // 验证评论已添加
    await expect(page.locator(`text=${comment}`)).toBeVisible({ timeout: 5000 });
  });

  test('删除任务', async ({ page }) => {
    // 先创建一个任务
    await createTask(page, testTask, testProject);
    
    // 点击任务进入详情页
    await page.click(`text=${testTask.title}`);
    await page.waitForLoadState('networkidle');
    
    // 点击删除按钮
    await page.click('button:has-text("删除"), [data-testid="delete-task"]');
    
    // 等待确认对话框
    await page.waitForSelector('.ant-modal-confirm', { timeout: 5000 });
    
    // 确认删除
    await page.click('button:has-text("确定")');
    
    // 等待删除成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证任务已从列表中移除
    await page.waitForURL('**/tasks', { timeout: 5000 });
    await expect(page.locator(`text=${testTask.title}`)).not.toBeVisible();
  });

  test('看板视图切换', async ({ page }) => {
    // 创建多个不同状态的任务
    await createTask(page, { ...testTask, title: `待办任务_${Date.now()}` }, testProject);
    
    // 导航到任务页面
    await page.click('text=任务');
    await page.waitForLoadState('networkidle');
    
    // 查找看板视图切换按钮
    const kanbanButton = page.locator('button:has-text("看板"), [data-testid="kanban-view"]');
    if (await kanbanButton.isVisible()) {
      await kanbanButton.click();
      
      // 验证看板视图显示
      await expect(page.locator('.kanban-board, .ant-col')).toBeVisible({ timeout: 5000 });
      
      // 验证看板列
      await expect(page.locator('text=待办')).toBeVisible();
      await expect(page.locator('text=进行中')).toBeVisible();
      await expect(page.locator('text=已完成')).toBeVisible();
    }
  });

  test('甘特图视图', async ({ page }) => {
    // 创建多个任务
    await createTask(page, { ...testTask, title: `甘特图任务1_${Date.now()}` }, testProject);
    await createTask(page, { ...testTask, title: `甘特图任务2_${Date.now()}` }, testProject);
    
    // 导航到任务页面
    await page.click('text=任务');
    await page.waitForLoadState('networkidle');
    
    // 查找甘特图视图切换按钮
    const ganttButton = page.locator('button:has-text("甘特图"), [data-testid="gantt-view"]');
    if (await ganttButton.isVisible()) {
      await ganttButton.click();
      
      // 验证甘特图显示
      await expect(page.locator('.gantt-chart, canvas')).toBeVisible({ timeout: 5000 });
    }
  });

  test('任务筛选功能', async ({ page }) => {
    // 创建不同优先级的任务
    await createTask(page, { ...testTask, title: `高优先级任务_${Date.now()}` }, testProject);
    
    // 导航到任务页面
    await page.click('text=任务');
    await page.waitForLoadState('networkidle');
    
    // 点击筛选按钮
    await page.click('button:has-text("筛选"), .anticon-filter');
    
    // 选择优先级筛选
    await page.click('text=高优先级');
    
    // 等待筛选结果
    await page.waitForTimeout(1000);
    
    // 验证筛选结果
    await expect(page.locator('text=高优先级任务')).toBeVisible();
  });

  test('响应式布局 - 移动端任务列表', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    
    // 导航到任务页面
    await page.click('text=任务');
    await page.waitForLoadState('networkidle');
    
    // 验证移动端布局
    await expect(page.locator('button:has-text("创建"), button:has-text("新建")')).toBeVisible();
    
    // 验证任务卡片在移动端可访问
    const taskCards = page.locator('.ant-card, .task-item');
    await expect(taskCards.first()).toBeVisible();
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
