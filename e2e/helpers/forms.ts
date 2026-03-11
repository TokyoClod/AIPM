import { Page } from '@playwright/test';

export async function fillInput(page: Page, selector: string, value: string): Promise<void> {
  await page.fill(selector, value);
}

export async function fillForm(page: Page, fields: Record<string, string>): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
}

export async function selectOption(page: Page, selectSelector: string, optionText: string): Promise<void> {
  await page.click(selectSelector);
  await page.click(`text=${optionText}`);
}

export async function selectMultipleOptions(page: Page, selectSelector: string, options: string[]): Promise<void> {
  await page.click(selectSelector);
  for (const option of options) {
    await page.click(`text=${option}`);
  }
  await page.keyboard.press('Escape');
}

export async function checkCheckbox(page: Page, selector: string): Promise<void> {
  const checkbox = page.locator(selector);
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
}

export async function uncheckCheckbox(page: Page, selector: string): Promise<void> {
  const checkbox = page.locator(selector);
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
}

export async function uploadFile(page: Page, inputSelector: string, filePath: string): Promise<void> {
  await page.setInputFiles(inputSelector, filePath);
}

export async function submitForm(page: Page, submitButtonSelector: string = 'button[type="submit"]'): Promise<void> {
  await page.click(submitButtonSelector);
}

export async function clearInput(page: Page, selector: string): Promise<void> {
  await page.fill(selector, '');
}

export async function getInputValue(page: Page, selector: string): Promise<string> {
  return await page.inputValue(selector);
}

export async function isFormValid(page: Page, formSelector: string = 'form'): Promise<boolean> {
  const form = page.locator(formSelector);
  const errorMessages = await form.locator('.ant-form-item-explain-error, .error-message').count();
  return errorMessages === 0;
}

export async function waitForFormError(page: Page, errorMessage: string): Promise<void> {
  await page.waitForSelector(`text=${errorMessage}`, { timeout: 5000 });
}

export async function fillDatePicker(page: Page, selector: string, date: string): Promise<void> {
  await page.click(selector);
  await page.fill(selector, date);
  await page.keyboard.press('Enter');
}

export async function fillRichTextEditor(page: Page, selector: string, content: string): Promise<void> {
  const editor = page.locator(selector);
  await editor.click();
  await editor.fill(content);
}

export async function selectDropdownByIndex(page: Page, selector: string, index: number): Promise<void> {
  await page.click(selector);
  const options = page.locator('.ant-select-dropdown .ant-select-item');
  await options.nth(index).click();
}
