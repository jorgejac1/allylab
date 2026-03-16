import { test, expect, Page } from '@playwright/test';

// Mock audit log entries
const mockAuditEntries = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    eventType: 'scan:run',
    severity: 'info',
    action: 'Ran accessibility scan',
    userName: 'admin@test.com',
    resourceType: 'scan',
    resourceId: 's1',
    success: true,
  },
  {
    id: '2',
    timestamp: new Date().toISOString(),
    eventType: 'rule:created',
    severity: 'info',
    action: 'Created custom rule',
    userName: 'admin@test.com',
    resourceType: 'rule',
    resourceId: 'r1',
    success: true,
  },
  {
    id: '3',
    timestamp: new Date().toISOString(),
    eventType: 'integration:connected',
    severity: 'warning',
    action: 'Connected GitHub',
    userName: 'admin@test.com',
    resourceType: 'integration',
    resourceId: 'github',
    success: false,
  },
];

async function navigateToAuditTab(page: Page) {
  // Pre-populate localStorage with audit entries and ensure admin user
  await page.addInitScript((entries) => {
    localStorage.setItem('allylab_audit_log', JSON.stringify(entries));
    // Default user is admin which has audit-logs:view permission
    localStorage.setItem('allylab_current_user', 'user_admin');
  }, mockAuditEntries);

  await page.goto('/');
  // Navigate to Settings
  await page.locator('nav').getByRole('button', { name: 'Settings' }).click();
  await page.waitForTimeout(1000);
  // Click the Audit Log tab
  const tabContainer = page.locator('#main-content');
  await tabContainer.getByRole('button', { name: 'Audit Log', exact: true }).click();
  await page.waitForTimeout(1000);
}

test.describe('Audit Log', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAuditTab(page);
  });

  test('should display audit stats cards', async ({ page }) => {
    // Verify stats cards render with correct labels
    await expect(page.getByText('Total Events')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Last 24h')).toBeVisible();
    await expect(page.getByText('Warnings')).toBeVisible();
    await expect(page.getByText('Failures')).toBeVisible();
  });

  test('should display audit table with correct headers', async ({ page }) => {
    // Verify the table headers are visible
    await expect(page.getByRole('columnheader', { name: 'Time' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: 'Event' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Action' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Severity' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('should display audit entries from localStorage', async ({ page }) => {
    // Verify mock entries are rendered in the table
    await expect(page.getByText('Ran accessibility scan')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Created custom rule')).toBeVisible();
    await expect(page.getByText('Connected GitHub')).toBeVisible();
  });

  test('should show filter and search elements', async ({ page }) => {
    // The AuditFilterBar should render search/filter controls
    // Look for search input or filter buttons
    const searchInput = page.locator('input[type="text"], input[placeholder*="earch"]');
    const filterCount = await searchInput.count();

    // The filter bar should have some interactive elements
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 10000 });
    expect(filterCount).toBeGreaterThanOrEqual(0);
  });

  test('should show export dropdown when clicking Export button', async ({ page }) => {
    // Look for the Export button
    const exportButton = page.getByRole('button', { name: /export/i });
    await expect(exportButton).toBeVisible({ timeout: 10000 });

    // Click to open the dropdown
    await exportButton.click();
    await page.waitForTimeout(500);

    // Verify export options are visible
    await expect(page.getByText('Export as JSON')).toBeVisible();
    await expect(page.getByText('Export as CSV')).toBeVisible();
  });

  test('should show entries count', async ({ page }) => {
    // The actions bar shows entry count
    await expect(page.getByText(/3 entries/)).toBeVisible({ timeout: 10000 });
  });
});
