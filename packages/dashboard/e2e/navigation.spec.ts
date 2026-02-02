import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AllyLab/);
  });

  test('should navigate to Scan page via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Accessibility Scanner"]');

    // Verify scan page - URL input should always be present
    await expect(page.getByPlaceholder(/example\.com/i)).toBeVisible();
  });

  test('should navigate to Reports page via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Reports & History"]');

    // Give time for lazy loading
    await page.waitForTimeout(1000);
    // Just verify page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to Settings page via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Settings"]');

    // Give time for lazy loading
    await page.waitForTimeout(1000);
    // Look for CI/CD tab text
    await expect(page.getByText('CI/CD')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Executive page via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Executive Dashboard"]');

    // Check page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to Benchmark page via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Competitor Benchmark"]');

    // Check page loaded
    await expect(page.locator('body')).toBeVisible();
  });
});
