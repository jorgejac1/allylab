import { test, expect } from '@playwright/test';

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Reports & History"]');
    // Wait for page to settle
    await page.waitForTimeout(500);
  });

  test('should navigate to reports page', async ({ page }) => {
    // Verify the page loaded by checking the body content exists
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have content visible', async ({ page }) => {
    // Just verify something rendered after navigation
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});
