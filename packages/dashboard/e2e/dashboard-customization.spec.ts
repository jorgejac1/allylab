import { test, expect, Page } from '@playwright/test';

// Mock scans so the executive dashboard has data to display
const mockScans = [
  {
    id: 'scan-1',
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    score: 82,
    totalIssues: 8,
    critical: 1,
    serious: 2,
    moderate: 3,
    minor: 2,
    scanDuration: 2500,
    findings: [],
    trackedFindings: [],
  },
  {
    id: 'scan-2',
    url: 'https://example.com',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    score: 78,
    totalIssues: 10,
    critical: 2,
    serious: 3,
    moderate: 3,
    minor: 2,
    scanDuration: 2800,
    findings: [],
    trackedFindings: [],
  },
  {
    id: 'scan-3',
    url: 'https://another-site.com',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    score: 90,
    totalIssues: 3,
    critical: 0,
    serious: 1,
    moderate: 1,
    minor: 1,
    scanDuration: 2200,
    findings: [],
    trackedFindings: [],
  },
];

async function setupDashboard(page: Page) {
  await page.addInitScript((scans) => {
    localStorage.setItem('allylab_scans', JSON.stringify(scans));
    localStorage.setItem('allylab_false_positives', JSON.stringify([]));
    localStorage.setItem('allylab_current_user', 'user_admin');
  }, mockScans);

  await page.goto('/');
  await page.click('nav button:has-text("Executive Dashboard")');
  await page.waitForTimeout(1000);
}

test.describe('Dashboard Customization', () => {
  test.beforeEach(async ({ page }) => {
    await setupDashboard(page);
  });

  test('should display Customize button on executive dashboard', async ({ page }) => {
    // The Customize button should be visible on the dashboard
    await expect(page.getByRole('button', { name: /customize/i })).toBeVisible({ timeout: 10000 });
  });

  test('should show edit panel when clicking Customize', async ({ page }) => {
    // Click the Customize button
    await page.getByRole('button', { name: /customize/i }).click();
    await page.waitForTimeout(500);

    // The WidgetTogglePanel should appear with the "Dashboard Widgets" heading
    await expect(page.getByText('Dashboard Widgets')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/drag to reorder/i)).toBeVisible();
  });

  test('should show widget toggle checkboxes in edit mode', async ({ page }) => {
    // Enter edit mode
    await page.getByRole('button', { name: /customize/i }).click();
    await page.waitForTimeout(500);

    // Verify widget labels are visible as toggles
    await expect(page.getByText('KPI Cards')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Severity Breakdown')).toBeVisible();
    await expect(page.getByText('Top Issues')).toBeVisible();
    await expect(page.getByText('Site Rankings')).toBeVisible();
    await expect(page.getByText('Goal Progress')).toBeVisible();
    await expect(page.getByText('Score Trend')).toBeVisible();

    // Checkboxes should be present for each widget
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('should show Done and Cancel buttons in edit mode', async ({ page }) => {
    // Enter edit mode
    await page.getByRole('button', { name: /customize/i }).click();
    await page.waitForTimeout(500);

    // Done and Cancel buttons should appear
    await expect(page.getByRole('button', { name: /done/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('should exit edit mode when clicking Done', async ({ page }) => {
    // Enter edit mode
    await page.getByRole('button', { name: /customize/i }).click();
    await page.waitForTimeout(500);

    // Click Done
    await page.getByRole('button', { name: /done/i }).click();
    await page.waitForTimeout(500);

    // Should return to normal view with Customize button visible again
    await expect(page.getByRole('button', { name: /customize/i })).toBeVisible({ timeout: 10000 });
    // The widget toggle panel should no longer be visible
    await expect(page.getByText('Dashboard Widgets')).not.toBeVisible();
  });

  test('should exit edit mode when clicking Cancel', async ({ page }) => {
    // Enter edit mode
    await page.getByRole('button', { name: /customize/i }).click();
    await page.waitForTimeout(500);

    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(500);

    // Should return to normal view
    await expect(page.getByRole('button', { name: /customize/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Dashboard Widgets')).not.toBeVisible();
  });

  test('should show size toggle buttons (Half/Full) for each widget', async ({ page }) => {
    // Enter edit mode
    await page.getByRole('button', { name: /customize/i }).click();
    await page.waitForTimeout(500);

    // Each widget row should have Half and Full buttons
    const halfButtons = page.getByRole('button', { name: 'Half' });
    const fullButtons = page.getByRole('button', { name: 'Full' });
    const halfCount = await halfButtons.count();
    const fullCount = await fullButtons.count();

    expect(halfCount).toBeGreaterThanOrEqual(6);
    expect(fullCount).toBeGreaterThanOrEqual(6);
  });
});
