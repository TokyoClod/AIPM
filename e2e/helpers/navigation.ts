import { Page } from '@playwright/test';

export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function navigateToProjects(page: Page): Promise<void> {
  await page.click('text=项目');
  await page.waitForLoadState('networkidle');
  await page.waitForURL(/.*projects/);
}

export async function navigateToTasks(page: Page): Promise<void> {
  await page.click('text=任务');
  await page.waitForLoadState('networkidle');
  await page.waitForURL(/.*tasks/);
}

export async function navigateToRisks(page: Page): Promise<void> {
  await page.click('text=风险');
  await page.waitForLoadState('networkidle');
  await page.waitForURL(/.*risks/);
}

export async function navigateToTeam(page: Page): Promise<void> {
  await page.click('text=团队');
  await page.waitForLoadState('networkidle');
  await page.waitForURL(/.*team/);
}

export async function navigateToKnowledge(page: Page): Promise<void> {
  await page.click('text=知识库');
  await page.waitForLoadState('networkidle');
  await page.waitForURL(/.*knowledge/);
}

export async function navigateToProjectDetail(page: Page, projectId: string | number): Promise<void> {
  await page.goto(`/projects/${projectId}`);
  await page.waitForLoadState('networkidle');
}

export async function navigateToTaskDetail(page: Page, taskId: string | number): Promise<void> {
  await page.goto(`/tasks/${taskId}`);
  await page.waitForLoadState('networkidle');
}

export async function navigateBack(page: Page): Promise<void> {
  await page.goBack();
  await page.waitForLoadState('networkidle');
}

export async function clickSidebarItem(page: Page, itemName: string): Promise<void> {
  await page.click(`text=${itemName}`);
  await page.waitForLoadState('networkidle');
}

export async function openMobileMenu(page: Page): Promise<void> {
  const menuButton = page.locator('.anticon-menu, .menu-toggle, [data-testid="menu-toggle"]');
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.waitForTimeout(300);
  }
}

export async function closeMobileMenu(page: Page): Promise<void> {
  const closeButton = page.locator('.anticon-close, .menu-close, [data-testid="menu-close"]');
  if (await closeButton.isVisible()) {
    await closeButton.click();
    await page.waitForTimeout(300);
  }
}

export async function getCurrentPath(page: Page): Promise<string> {
  const url = page.url();
  return url.replace(/^.*\/\/[^\/]+/, '');
}
