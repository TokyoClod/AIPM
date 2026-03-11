import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotOptions {
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  mask?: string[];
  animations?: 'disabled' | 'allow';
}

export async function takeScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  options: ScreenshotOptions = {}
): Promise<Buffer> {
  const {
    fullPage = true,
    clip,
    mask = [],
    animations = 'disabled',
  } = options;

  const screenshot = await page.screenshot({
    fullPage,
    clip,
    mask: mask.map(selector => page.locator(selector)),
    animations,
  });

  const snapshotPath = testInfo.snapshotPath(`${name}.png`);
  const snapshotDir = path.dirname(snapshotPath);
  
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }

  fs.writeFileSync(snapshotPath, screenshot);

  return screenshot;
}

export async function compareScreenshots(
  page: Page,
  testInfo: TestInfo,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const {
    fullPage = true,
    clip,
    mask = [],
    animations = 'disabled',
  } = options;

  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage,
    clip,
    mask: mask.map(selector => page.locator(selector)),
    animations,
    maxDiffPixels: 100,
    maxDiffPixelRatio: 0.01,
  });
}

export async function takeElementScreenshot(
  page: Page,
  testInfo: TestInfo,
  selector: string,
  name: string
): Promise<Buffer> {
  const element = page.locator(selector);
  
  const screenshot = await element.screenshot({
    animations: 'disabled',
  });

  const snapshotPath = testInfo.snapshotPath(`${name}.png`);
  const snapshotDir = path.dirname(snapshotPath);
  
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }

  fs.writeFileSync(snapshotPath, screenshot);

  return screenshot;
}

export async function compareElementScreenshots(
  page: Page,
  testInfo: TestInfo,
  selector: string,
  name: string
): Promise<void> {
  const element = page.locator(selector);
  
  await expect(element).toHaveScreenshot(`${name}.png`, {
    maxDiffPixels: 100,
    maxDiffPixelRatio: 0.01,
  });
}

export async function takeResponsiveScreenshots(
  page: Page,
  testInfo: TestInfo,
  name: string,
  viewports: Array<{ name: string; width: number; height: number }>
): Promise<void> {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForLoadState('networkidle');
    
    await takeScreenshot(page, testInfo, `${name}-${viewport.name}`, {
      fullPage: true,
    });
  }
}

export async function waitForStablePage(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState('networkidle');
  
  await page.waitForTimeout(500);
  
  await page.waitForLoadState('domcontentloaded');
}

export function getSnapshotPath(
  testInfo: TestInfo,
  name: string,
  browser?: string
): string {
  const browserName = browser || testInfo.project.name;
  return testInfo.snapshotPath(`${browserName}/${name}.png`);
}

import { expect } from '@playwright/test';
