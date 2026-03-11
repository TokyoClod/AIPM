import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  return {
    name: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'Test123456'
  };
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.click('text=登录');
  await page.fill('input[placeholder="邮箱地址"]', email);
  await page.fill('input[placeholder="密码"]', password);
  await page.click('button:has-text("登录")');
  
  await page.waitForURL('/', { timeout: 10000 });
}

export async function register(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.click('text=注册');
  await page.fill('input[placeholder="用户名"]', user.name);
  await page.fill('input[placeholder="邮箱地址"]', user.email);
  await page.fill('input[placeholder="设置密码"]', user.password);
  await page.click('button:has-text("创建账号")');
  
  await page.waitForURL('/', { timeout: 10000 });
}

export async function registerAndLogin(page: Page, user: TestUser): Promise<void> {
  await register(page, user);
}

export async function logout(page: Page): Promise<void> {
  await page.click('.anticon-user, [data-testid="user-menu"], .user-avatar');
  await page.click('text=登出, text=退出登录');
  await page.waitForURL('/login', { timeout: 5000 });
}

export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('token');
  });
}

export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
  }, token);
}

export async function clearAuth(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
  });
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  const token = await getAuthToken(page);
  return !!token;
}

export async function waitForAuthState(page: Page, expectedState: boolean): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const token = localStorage.getItem('token');
      return expected ? !!token : !token;
    },
    expectedState,
    { timeout: 5000 }
  );
}
