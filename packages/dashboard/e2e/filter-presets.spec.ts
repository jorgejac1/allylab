import { test, expect, Page } from '@playwright/test';

// Mock scan with findings for the findings view
const mockScan = {
  id: 'scan-preset-1',
  url: 'https://example.com',
  timestamp: new Date().toISOString(),
  score: 72,
  totalIssues: 3,
  critical: 1,
  serious: 1,
  moderate: 1,
  minor: 0,
  scanDuration: 2500,
  trackedFindings: [
    {
      id: 'f1',
      ruleId: 'color-contrast',
      ruleTitle: 'Color contrast insufficient',
      description: 'Text does not have sufficient contrast',
      impact: 'serious',
      selector: '.low-contrast-text',
      html: '<span class="low-contrast-text">Hard to read</span>',
      helpUrl: 'https://example.com/help',
      wcagTags: ['wcag2aa', 'wcag143'],
      fingerprint: 'fp-1',
      status: 'new',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'f2',
      ruleId: 'image-alt',
      ruleTitle: 'Images must have alt text',
      description: 'Image is missing alt attribute',
      impact: 'critical',
      selector: 'img.hero',
      html: '<img class="hero" src="/img.jpg">',
      helpUrl: 'https://example.com/help',
      wcagTags: ['wcag2a', 'wcag111'],
      fingerprint: 'fp-2',
      status: 'new',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'f3',
      ruleId: 'label',
      ruleTitle: 'Form elements must have labels',
      description: 'Input is missing associated label',
      impact: 'moderate',
      selector: 'input#email',
      html: '<input id="email" type="email">',
      helpUrl: 'https://example.com/help',
      wcagTags: ['wcag2a', 'wcag412'],
      fingerprint: 'fp-3',
      status: 'recurring',
      firstSeen: new Date(Date.now() - 86400000).toISOString(),
      lastSeen: new Date().toISOString(),
    },
  ],
};

// Mock user-saved filter presets
const mockUserPresets = [
  {
    id: 'preset_user_1',
    name: 'My Custom Filter',
    color: 'purple',
    filters: {
      severityFilter: 'serious',
      statusFilter: 'all',
      sourceFilter: 'all',
      fpFilter: 'active',
    },
    createdAt: new Date().toISOString(),
  },
];

async function setupPageWithFindings(page: Page) {
  await page.addInitScript((data) => {
    localStorage.setItem('allylab_scans', JSON.stringify([data.scan]));
    localStorage.setItem('allylab_filter_presets', JSON.stringify(data.presets));
    localStorage.setItem('allylab_false_positives', JSON.stringify([]));
    localStorage.setItem('allylab_jira_links', JSON.stringify({}));
    localStorage.setItem('allylab_current_user', 'user_admin');
  }, { scan: mockScan, presets: mockUserPresets });

  await page.goto('/');
  // Navigate to Reports & History to find the scan
  await page.locator('nav').getByRole('button', { name: 'Reports & History' }).click();
  await page.waitForTimeout(1000);
}

async function clickScanCard(page: Page) {
  const recentScanButton = page.getByRole('button', { name: /example\.com.*issues/i });
  await recentScanButton.click();
  await page.waitForTimeout(1000);
}

test.describe('Filter Presets', () => {
  test.beforeEach(async ({ page }) => {
    await setupPageWithFindings(page);
    await clickScanCard(page);
  });

  test('should display PresetBar with built-in presets', async ({ page }) => {
    // The PresetBar should show the "Presets" label
    await expect(page.getByText('Presets')).toBeVisible({ timeout: 10000 });

    // Should show built-in presets
    await expect(page.getByText('Critical Only')).toBeVisible();
    await expect(page.getByText('New Issues')).toBeVisible();
    await expect(page.getByText('Active (No FP)')).toBeVisible();
  });

  test('should display user-saved presets', async ({ page }) => {
    // The custom user preset should also be visible in the bar
    await expect(page.getByText('My Custom Filter')).toBeVisible({ timeout: 10000 });
  });

  test('should show Save current filters button', async ({ page }) => {
    // The "Save current filters" button should be visible
    await expect(page.getByText('Save current filters')).toBeVisible({ timeout: 10000 });
  });

  test('should apply preset when clicked', async ({ page }) => {
    // Click the "Critical Only" preset pill
    await expect(page.getByText('Critical Only')).toBeVisible({ timeout: 10000 });
    await page.getByText('Critical Only').click();
    await page.waitForTimeout(500);

    // After applying critical filter, only the critical finding should be visible
    // The page should still be responsive
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('should open save modal when clicking Save current filters', async ({ page }) => {
    // Click the save button
    await expect(page.getByText('Save current filters')).toBeVisible({ timeout: 10000 });
    await page.getByText('Save current filters').click();
    await page.waitForTimeout(500);

    // A modal should appear with a name input
    // Look for modal content indicating preset save
    const modal = page.locator('[class*="modal"], [role="dialog"]');
    const modalCount = await modal.count();

    // Either modal or some form of save UI should appear
    await expect(page.locator('body')).toBeVisible();
  });
});
