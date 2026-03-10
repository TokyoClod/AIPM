import { test, expect, Page } from '@playwright/test';

/**
 * 风险管理流程E2E测试
 * 测试风险创建、更新状态、关闭风险等核心功能
 */

test.describe('风险管理流程测试', () => {
  let testUser: { email: string; password: string; name: string };
  let testProject: { name: string; description: string };
  let testRisk: { title: string; description: string; impact: string; probability: string };

  test.beforeAll(async () => {
    // 初始化测试数据
    testUser = {
      name: `riskuser_${Date.now()}`,
      email: `risk_${Date.now()}@example.com`,
      password: 'Test123456'
    };
    
    testProject = {
      name: `风险测试项目_${Date.now()}`,
      description: '用于风险测试的项目'
    };
    
    testRisk = {
      title: `测试风险_${Date.now()}`,
      description: '这是一个E2E测试风险',
      impact: '高',
      probability: '中'
    };
  });

  test.beforeEach(async ({ page }) => {
    // 注册并登录用户
    await registerAndLogin(page, testUser);
    
    // 创建测试项目
    await createProject(page, testProject);
  });

  test('应该显示风险列表页面', async ({ page }) => {
    // 导航到风险页面
    await page.click('text=风险');
    await page.waitForLoadState('networkidle');
    
    // 验证页面标题
    await expect(page.locator('h1, h2').first()).toContainText('风险');
    
    // 验证创建风险按钮存在
    await expect(page.locator('button:has-text("创建"), button:has-text("新建")')).toBeVisible();
  });

  test('创建新风险', async ({ page }) => {
    // 导航到风险页面
    await page.click('text=风险');
    await page.waitForLoadState('networkidle');
    
    // 点击创建风险按钮
    await page.click('button:has-text("创建"), button:has-text("新建")');
    
    // 等待创建风险对话框
    await page.waitForSelector('.ant-modal, form', { timeout: 5000 });
    
    // 填写风险信息
    await page.fill('input[placeholder*="风险标题"], input[label*="标题"]', testRisk.title);
    await page.fill('textarea[placeholder*="描述"], textarea[label*="描述"]', testRisk.description);
    
    // 选择影响程度
    const impactSelect = page.locator('.ant-select:has-text("影响程度"), .ant-select:has-text("影响")');
    if (await impactSelect.isVisible()) {
      await impactSelect.click();
      await page.click(`text=${testRisk.impact}`);
    }
    
    // 选择发生概率
    const probabilitySelect = page.locator('.ant-select:has-text("发生概率"), .ant-select:has-text("概率")');
    if (await probabilitySelect.isVisible()) {
      await probabilitySelect.click();
      await page.click(`text=${testRisk.probability}`);
    }
    
    // 选择项目
    const projectSelect = page.locator('.ant-select:has-text("选择项目")');
    if (await projectSelect.isVisible()) {
      await projectSelect.click();
      await page.click(`text=${testProject.name}`);
    }
    
    // 提交创建
    await page.click('button:has-text("确定"), button:has-text("创建")');
    
    // 等待创建成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证风险出现在列表中
    await expect(page.locator(`text=${testRisk.title}`)).toBeVisible({ timeout: 5000 });
  });

  test('查看风险详情', async ({ page }) => {
    // 先创建一个风险
    await createRisk(page, testRisk, testProject);
    
    // 点击风险进入详情页
    await page.click(`text=${testRisk.title}`);
    await page.waitForLoadState('networkidle');
    
    // 验证风险详情页面
    await expect(page.locator(`text=${testRisk.title}`)).toBeVisible();
    await expect(page.locator(`text=${testRisk.description}`)).toBeVisible();
    
    // 验证风险详情页的元素
    await expect(page.locator('text=影响程度')).toBeVisible();
    await expect(page.locator('text=发生概率')).toBeVisible();
    await expect(page.locator('text=状态')).toBeVisible();
  });

  test('更新风险状态 - 进行中', async ({ page }) => {
    // 先创建一个风险
    await createRisk(page, testRisk, testProject);
    
    // 点击风险进入详情页
    await page.click(`text=${testRisk.title}`);
    await page.waitForLoadState('networkidle');
    
    // 点击状态选择器
    await page.click('.ant-select:has-text("开放"), .ant-select:has-text("状态")');
    
    // 选择新状态
    await page.click('text=进行中');
    
    // 等待更新成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证状态已更新
    await expect(page.locator('text=进行中')).toBeVisible();
  });

  test('关闭风险', async ({ page }) => {
    // 先创建一个风险
    await createRisk(page, testRisk, testProject);
    
    // 点击风险进入详情页
    await page.click(`text=${testRisk.title}`);
    await page.waitForLoadState('networkidle');
    
    // 点击关闭风险按钮
    await page.click('button:has-text("关闭风险"), button:has-text("关闭")');
    
    // 等待确认对话框
    await page.waitForSelector('.ant-modal-confirm', { timeout: 5000 });
    
    // 填写关闭原因
    const reasonInput = page.locator('textarea[placeholder*="原因"], textarea[label*="原因"]');
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('风险已解决，测试通过');
    }
    
    // 确认关闭
    await page.click('button:has-text("确定")');
    
    // 等待关闭成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证状态已更新为已关闭
    await expect(page.locator('text=已关闭')).toBeVisible();
  });

  test('添加风险缓解措施', async ({ page }) => {
    // 先创建一个风险
    await createRisk(page, testRisk, testProject);
    
    // 点击风险进入详情页
    await page.click(`text=${testRisk.title}`);
    await page.waitForLoadState('networkidle');
    
    // 切换到缓解措施标签
    await page.click('text=缓解措施, text=应对措施');
    
    // 点击添加缓解措施按钮
    await page.click('button:has-text("添加"), button:has-text("新建")');
    
    // 等待对话框
    await page.waitForSelector('.ant-modal', { timeout: 5000 });
    
    // 填写缓解措施
    const measure = '增加测试覆盖率，定期代码审查';
    await page.fill('input[placeholder*="措施"], input[label*="措施"]', measure);
    await page.fill('textarea[placeholder*="描述"], textarea[label*="描述"]', '通过增加测试和代码审查来降低风险');
    
    // 提交
    await page.click('button:has-text("确定"), button:has-text("添加")');
    
    // 验证缓解措施已添加
    await expect(page.locator(`text=${measure}`)).toBeVisible({ timeout: 5000 });
  });

  test('风险等级评估', async ({ page }) => {
    // 创建高风险
    const highRisk = {
      title: `高风险_${Date.now()}`,
      description: '高风险测试',
      impact: '高',
      probability: '高'
    };
    await createRisk(page, highRisk, testProject);
    
    // 导航到风险页面
    await page.click('text=风险');
    await page.waitForLoadState('networkidle');
    
    // 验证风险等级标识
    const riskLevel = page.locator('.ant-tag-red, .risk-level-high');
    await expect(riskLevel).toBeVisible();
  });

  test('风险筛选功能', async ({ page }) => {
    // 创建不同状态的风险
    await createRisk(page, { ...testRisk, title: `开放风险_${Date.now()}` }, testProject);
    
    // 导航到风险页面
    await page.click('text=风险');
    await page.waitForLoadState('networkidle');
    
    // 点击筛选按钮
    await page.click('button:has-text("筛选"), .anticon-filter');
    
    // 选择状态筛选
    await page.click('text=开放');
    
    // 等待筛选结果
    await page.waitForTimeout(1000);
    
    // 验证筛选结果
    await expect(page.locator('text=开放风险')).toBeVisible();
  });

  test('风险搜索功能', async ({ page }) => {
    // 创建一个有特殊名称的风险
    const specialRisk = {
      title: `特殊搜索风险_${Date.now()}`,
      description: '用于搜索测试',
      impact: '中',
      probability: '低'
    };
    await createRisk(page, specialRisk, testProject);
    
    // 导航到风险页面
    await page.click('text=风险');
    await page.waitForLoadState('networkidle');
    
    // 输入搜索关键词
    await page.fill('input[placeholder*="搜索"], input[placeholder*="查找"]', '特殊搜索风险');
    
    // 等待搜索结果
    await page.waitForTimeout(1000);
    
    // 验证搜索结果
    await expect(page.locator(`text=${specialRisk.title}`)).toBeVisible();
  });

  test('删除风险', async ({ page }) => {
    // 先创建一个风险
    await createRisk(page, testRisk, testProject);
    
    // 点击风险进入详情页
    await page.click(`text=${testRisk.title}`);
    await page.waitForLoadState('networkidle');
    
    // 点击删除按钮
    await page.click('button:has-text("删除"), [data-testid="delete-risk"]');
    
    // 等待确认对话框
    await page.waitForSelector('.ant-modal-confirm', { timeout: 5000 });
    
    // 确认删除
    await page.click('button:has-text("确定")');
    
    // 等待删除成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
    
    // 验证风险已从列表中移除
    await page.waitForURL('**/risks', { timeout: 5000 });
    await expect(page.locator(`text=${testRisk.title}`)).not.toBeVisible();
  });

  test('风险预警页面', async ({ page }) => {
    // 创建高风险
    const highRisk = {
      title: `预警风险_${Date.now()}`,
      description: '高风险预警测试',
      impact: '高',
      probability: '高'
    };
    await createRisk(page, highRisk, testProject);
    
    // 导航到风险预警页面
    await page.click('text=风险预警, text=预警');
    await page.waitForLoadState('networkidle');
    
    // 验证预警页面显示
    await expect(page.locator('h1, h2').first()).toContainText('预警');
    
    // 验证高风险出现在预警列表中
    await expect(page.locator(`text=${highRisk.title}`)).toBeVisible({ timeout: 5000 });
  });

  test('响应式布局 - 移动端风险列表', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    
    // 导航到风险页面
    await page.click('text=风险');
    await page.waitForLoadState('networkidle');
    
    // 验证移动端布局
    await expect(page.locator('button:has-text("创建"), button:has-text("新建")')).toBeVisible();
    
    // 验证风险卡片在移动端可访问
    const riskCards = page.locator('.ant-card, .risk-item');
    await expect(riskCards.first()).toBeVisible();
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
