import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  
  testMatch: '**/*.spec.ts',
  
  timeout: 30000,
  
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  
  fullyParallel: true,
  
  forbidOnly: !!process.env.CI,
  
  retries: process.env.CI ? 2 : 0,
  
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  snapshotDir: './e2e/snapshots',
  
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',
  
  use: {
    baseURL: 'http://localhost:5174',
    
    actionTimeout: 10000,
    
    trace: 'on-first-retry',
    
    screenshot: 'only-on-failure',
    
    video: 'retain-on-failure',
    
    viewport: { width: 1280, height: 720 },
    
    ignoreHTTPSErrors: true,
    
    storageState: '.auth/user.json',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['setup'],
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 }
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 812 }
      },
      dependencies: ['setup'],
    },
    {
      name: 'visual',
      testMatch: 'visual/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        screenshot: 'on',
      },
      snapshotPathTemplate: '{testDir}/snapshots/{testFilePath}/{arg}{ext}',
      dependencies: ['setup'],
    },
  ],

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
