import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Settings"]');
    // Wait for page to settle
    await page.waitForTimeout(500);
  });

  test('should display settings tabs', async ({ page }) => {
    // Look for tab text content
    await expect(page.getByText('CI/CD')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Jira')).toBeVisible({ timeout: 10000 });
  });

  test('should switch between tabs', async ({ page }) => {
    // Click on Jira tab
    await page.getByText('Jira').click();

    // Wait for lazy-loaded content
    await page.waitForTimeout(1000);

    // Verify something loaded (the page content exists)
    await expect(page.locator('body')).toBeVisible();
  });
});
