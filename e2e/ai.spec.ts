import { test, expect, Page } from '@playwright/test';

/**
 * AI功能E2E测试
 * 测试AI助手对话、快速录入等AI功能
 */

test.describe('AI功能测试', () => {
  let testUser: { email: string; password: string; name: string };

  test.beforeAll(async () => {
    // 初始化测试数据
    testUser = {
      name: `aiuser_${Date.now()}`,
      email: `ai_${Date.now()}@example.com`,
      password: 'Test123456'
    };
  });

  test.beforeEach(async ({ page }) => {
    // 注册并登录用户
    await registerAndLogin(page, testUser);
  });

  test('应该显示AI助手按钮', async ({ page }) => {
    // 验证AI助手按钮存在
    await expect(page.locator('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot')).toBeVisible({ timeout: 5000 });
  });

  test('打开AI助手对话框', async ({ page }) => {
    // 点击AI助手按钮
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    
    // 等待AI助手对话框打开
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 验证对话框标题
    await expect(page.locator('text=AI助手, text=智能助手')).toBeVisible();
    
    // 验证输入框存在
    await expect(page.locator('input[placeholder*="输入"], textarea[placeholder*="输入"]')).toBeVisible();
  });

  test('AI对话 - 发送消息', async ({ page }) => {
    // 打开AI助手
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 输入消息
    const message = '帮我创建一个新的项目';
    await page.fill('input[placeholder*="输入"], textarea[placeholder*="输入"]', message);
    
    // 发送消息
    await page.click('button:has-text("发送"), .send-button, button[type="submit"]');
    
    // 验证消息已发送
    await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 5000 });
    
    // 等待AI回复（可能需要一些时间）
    await page.waitForTimeout(2000);
    
    // 验证AI回复存在
    const aiResponse = page.locator('.ai-message, .assistant-message').last();
    await expect(aiResponse).toBeVisible({ timeout: 10000 });
  });

  test('AI对话 - 创建项目', async ({ page }) => {
    // 打开AI助手
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 输入创建项目的请求
    const projectName = `AI创建项目_${Date.now()}`;
    await page.fill('input[placeholder*="输入"], textarea[placeholder*="输入"]', `创建一个名为"${projectName}"的项目`);
    
    // 发送消息
    await page.click('button:has-text("发送"), .send-button');
    
    // 等待AI处理
    await page.waitForTimeout(3000);
    
    // 验证项目创建成功或AI给出响应
    const response = page.locator('.ai-message, .assistant-message').last();
    await expect(response).toBeVisible({ timeout: 10000 });
  });

  test('AI对话 - 创建任务', async ({ page }) => {
    // 先创建一个项目
    await createProject(page, {
      name: `AI任务项目_${Date.now()}`,
      description: '用于AI创建任务的项目'
    });
    
    // 打开AI助手
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 输入创建任务的请求
    const taskTitle = `AI创建任务_${Date.now()}`;
    await page.fill('input[placeholder*="输入"], textarea[placeholder*="输入"]', `创建一个任务：${taskTitle}`);
    
    // 发送消息
    await page.click('button:has-text("发送"), .send-button');
    
    // 等待AI处理
    await page.waitForTimeout(3000);
    
    // 验证AI响应
    const response = page.locator('.ai-message, .assistant-message').last();
    await expect(response).toBeVisible({ timeout: 10000 });
  });

  test('快速录入功能 - 快捷键触发', async ({ page }) => {
    // 按下 Cmd+K (Mac) 或 Ctrl+K (Windows)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+K`);
    
    // 等待快速录入对话框打开
    await page.waitForSelector('.quick-input, .ant-modal', { timeout: 5000 });
    
    // 验证快速录入对话框显示
    await expect(page.locator('text=快速录入, text=快速创建')).toBeVisible();
  });

  test('快速录入 - 创建任务', async ({ page }) => {
    // 先创建一个项目
    await createProject(page, {
      name: `快速录入项目_${Date.now()}`,
      description: '用于快速录入的项目'
    });
    
    // 触发快速录入
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+K`);
    
    // 等待快速录入对话框打开
    await page.waitForSelector('.quick-input, .ant-modal', { timeout: 5000 });
    
    // 输入任务描述
    const taskDescription = '完成用户登录功能的开发，包括表单验证和API对接';
    await page.fill('input[placeholder*="输入"], textarea[placeholder*="输入"]', taskDescription);
    
    // 提交
    await page.click('button:has-text("创建"), button:has-text("提交")');
    
    // 等待创建成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('快速录入 - 创建风险', async ({ page }) => {
    // 先创建一个项目
    await createProject(page, {
      name: `快速录入风险项目_${Date.now()}`,
      description: '用于快速录入风险的项目'
    });
    
    // 触发快速录入
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+K`);
    
    // 等待快速录入对话框打开
    await page.waitForSelector('.quick-input, .ant-modal', { timeout: 5000 });
    
    // 输入风险描述
    const riskDescription = '风险：项目进度可能延期，影响程度高，发生概率中';
    await page.fill('input[placeholder*="输入"], textarea[placeholder*="输入"]', riskDescription);
    
    // 提交
    await page.click('button:has-text("创建"), button:has-text("提交")');
    
    // 等待创建成功
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('AI助手 - 关闭对话框', async ({ page }) => {
    // 打开AI助手
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 点击关闭按钮
    await page.click('.ant-modal-close, .close-button, button[aria-label="Close"]');
    
    // 验证对话框已关闭
    await page.waitForSelector('.ai-chat-window, .ant-modal', { state: 'hidden', timeout: 5000 });
  });

  test('AI助手 - 历史对话', async ({ page }) => {
    // 打开AI助手
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 发送多条消息
    for (let i = 0; i < 3; i++) {
      await page.fill('input[placeholder*="输入"], textarea[placeholder*="输入"]', `测试消息 ${i + 1}`);
      await page.click('button:has-text("发送"), .send-button');
      await page.waitForTimeout(1000);
    }
    
    // 验证消息历史显示
    const messages = page.locator('.message, .chat-message');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('AI助手 - 清空对话', async ({ page }) => {
    // 打开AI助手
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 发送一条消息
    await page.fill('input[placeholder*="输入"], textarea[placeholder*="输入"]', '测试消息');
    await page.click('button:has-text("发送"), .send-button');
    await page.waitForTimeout(1000);
    
    // 查找清空对话按钮
    const clearButton = page.locator('button:has-text("清空"), button:has-text("清除"), .clear-chat');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      
      // 确认清空
      const confirmButton = page.locator('.ant-modal-confirm button:has-text("确定")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // 验证对话已清空
      await page.waitForTimeout(500);
      const messages = page.locator('.message, .chat-message');
      const count = await messages.count();
      expect(count).toBe(0);
    }
  });

  test('AI助手 - 建议提示', async ({ page }) => {
    // 打开AI助手
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 验证建议提示存在
    const suggestions = page.locator('.suggestion, .quick-action, .prompt-suggestion');
    const count = await suggestions.count();
    
    if (count > 0) {
      // 点击第一个建议
      await suggestions.first().click();
      
      // 验证输入框已填充
      const input = page.locator('input[placeholder*="输入"], textarea[placeholder*="输入"]');
      const value = await input.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('AI助手 - 响应式布局', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    
    // 打开AI助手
    await page.click('.ai-assistant-button, [data-testid="ai-assistant"], .anticon-robot');
    await page.waitForSelector('.ai-chat-window, .ant-modal', { timeout: 5000 });
    
    // 验证移动端布局
    const chatWindow = page.locator('.ai-chat-window, .ant-modal');
    await expect(chatWindow).toBeVisible();
    
    // 验证输入框在移动端可访问
    await expect(page.locator('input[placeholder*="输入"], textarea[placeholder*="输入"]')).toBeVisible();
    
    // 验证发送按钮可点击
    await expect(page.locator('button:has-text("发送"), .send-button')).toBeVisible();
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
