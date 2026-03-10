import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E测试配置
 * 支持多浏览器测试、响应式测试、截图和视频录制
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',
  
  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',
  
  // 全局测试超时时间（30秒）
  timeout: 30000,
  
  // 每个测试的期望超时时间（5秒）
  expect: {
    timeout: 5000
  },
  
  // 完全并行运行测试
  fullyParallel: true,
  
  // CI环境下禁止test.only
  forbidOnly: !!process.env.CI,
  
  // CI环境下重试失败测试
  retries: process.env.CI ? 2 : 0,
  
  // CI环境下限制并行workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // 全局设置
  use: {
    // 基础URL
    baseURL: 'http://localhost:5174',
    
    // 操作超时时间
    actionTimeout: 10000,
    
    // 测试失败时收集trace
    trace: 'on-first-retry',
    
    // 测试失败时截图
    screenshot: 'only-on-failure',
    
    // 测试失败时录制视频
    video: 'retain-on-failure',
    
    // 浏览器视口大小（桌面）
    viewport: { width: 1280, height: 720 },
    
    // 忽略HTTPS错误
    ignoreHTTPSErrors: true,
  },

  // 配置项目（多浏览器测试）
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },
    
    // 响应式测试 - 平板设备
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 }
      },
    },
    
    // 响应式测试 - 手机设备
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 812 }
      },
    },
  ],

  // 测试前启动服务器
  webServer: [
    {
      command: 'cd server && npm run dev',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd client/dist && npx serve -p 5174 -s',
      port: 5174,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
