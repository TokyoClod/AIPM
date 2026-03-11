import { Page } from '@playwright/test';

export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

export async function waitForNavigation(page: Page, expectedUrl: string | RegExp): Promise<void> {
  await page.waitForURL(expectedUrl, { timeout: 10000 });
}

export async function waitForElement(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  await page.waitForSelector(selector, { timeout });
}

export async function waitForElementHidden(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

export async function waitForText(page: Page, text: string, timeout: number = 5000): Promise<void> {
  await page.waitForSelector(`text=${text}`, { timeout });
}

export async function waitForSpinnerToDisappear(page: Page): Promise<void> {
  const spinner = page.locator('.ant-spin, .loading, .spinner');
  if (await spinner.isVisible()) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

export async function waitForModal(page: Page): Promise<void> {
  await page.waitForSelector('.ant-modal', { timeout: 5000 });
}

export async function waitForModalToClose(page: Page): Promise<void> {
  await page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 5000 });
}

export async function waitForToast(page: Page, type: 'success' | 'error' | 'info' | 'warning' = 'success'): Promise<void> {
  await page.waitForSelector(`.ant-message-${type}`, { timeout: 5000 });
}

export async function waitForApiRequest(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForRequest(urlPattern, { timeout: 10000 });
}

export async function waitForApiResponse(page: Page, urlPattern: string | RegExp): Promise<void> {
  await page.waitForResponse(urlPattern, { timeout: 10000 });
}

export async function waitForTableToLoad(page: Page, tableSelector: string = '.ant-table'): Promise<void> {
  await page.waitForSelector(tableSelector, { timeout: 5000 });
  await waitForSpinnerToDisappear(page);
}

export async function waitForAnimation(page: Page, duration: number = 300): Promise<void> {
  await page.waitForTimeout(duration);
}

export async function waitForStableElement(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    },
    selector,
    { timeout: 5000 }
  );
}

export async function retryAction<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
