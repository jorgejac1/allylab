import { test, expect } from '@playwright/test';

test.describe('Scan Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Accessibility Scanner"]');
  });

  test('should display scan form with URL input', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/example\.com/i);
    await expect(urlInput).toBeVisible();
  });

  test('should allow entering a URL', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/example\.com/i);
    await urlInput.fill('https://example.com');
    await expect(urlInput).toHaveValue('https://example.com');
  });
});
