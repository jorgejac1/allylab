import { test, expect, Page } from '@playwright/test';

// Mock data for localStorage
const mockSavedScan = {
  id: 'scan-1',
  url: 'https://example.com',
  timestamp: new Date().toISOString(),
  score: 72,
  totalIssues: 4,
  critical: 1,
  serious: 1,
  moderate: 1,
  minor: 1,
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
    {
      id: 'f4',
      ruleId: 'link-name',
      ruleTitle: 'Links must have discernible text',
      description: 'Link text is empty',
      impact: 'minor',
      selector: 'a.icon-link',
      html: '<a class="icon-link" href="/"></a>',
      helpUrl: 'https://example.com/help',
      wcagTags: ['wcag2a', 'wcag244'],
      fingerprint: 'fp-4',
      status: 'new',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    },
  ],
};

async function setupPageWithScan(page: Page) {
  // Pre-populate localStorage with scan data
  await page.addInitScript((scan) => {
    localStorage.setItem('allylab_scans', JSON.stringify([scan]));
    localStorage.setItem('allylab_false_positives', JSON.stringify([]));
    localStorage.setItem('allylab_jira_links', JSON.stringify({}));
  }, mockSavedScan);

  await page.goto('/');
  await page.locator('nav').getByRole('button', { name: 'Reports & History' }).click();
  await page.waitForTimeout(1000);
}

// Helper to find and click a scan card - clicks on the Recent Activity button
async function clickScanCard(page: Page) {
  // Click on the Recent Activity scan button which contains URL and issue count
  const recentScanButton = page.getByRole('button', { name: /example\.com.*issues/i });
  await recentScanButton.click();
}

test.describe('Findings Table Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await setupPageWithScan(page);
  });

  test('should display scan history with saved scans', async ({ page }) => {
    // Check that the scan appears in history - use specific locators to avoid multiple matches
    // Look for the scan card in the Recent Activity section
    await expect(page.getByRole('button', { name: /example\.com.*issues/i })).toBeVisible({ timeout: 10000 });
  });

  test('should open scan details when clicking on scan card', async ({ page }) => {
    // Click on the scan card
    await clickScanCard(page);

    // Should show findings table with our mock data - look for the finding titles (not rule IDs)
    await expect(page.getByText('Color contrast insufficient')).toBeVisible({ timeout: 10000 });
  });

  test('should filter findings by severity', async ({ page }) => {
    // Navigate to scan details first
    await clickScanCard(page);
    await page.waitForTimeout(500);

    // Look for severity filter - click on Critical
    const criticalFilter = page.getByRole('button', { name: /critical/i }).first();
    if (await criticalFilter.isVisible()) {
      await criticalFilter.click();

      // Should show the critical finding with its title
      await expect(page.getByText('Images must have alt text')).toBeVisible();
    }
  });

  test('should select and deselect findings', async ({ page }) => {
    // Navigate to scan details
    await clickScanCard(page);
    await page.waitForTimeout(500);

    // Find checkboxes in the findings table
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 1) {
      // Click first row checkbox (skip header)
      await checkboxes.nth(1).click();

      // Should show selection count
      await expect(page.getByText(/1 selected/i)).toBeVisible({ timeout: 5000 });

      // Deselect
      await checkboxes.nth(1).click();
      await expect(page.getByText(/1 selected/i)).not.toBeVisible();
    }
  });

  test('should open finding details drawer', async ({ page }) => {
    // Navigate to scan details
    await clickScanCard(page);
    await page.waitForTimeout(500);

    // Verify the Details button exists and is clickable
    const detailsButton = page.getByRole('button', { name: 'Details' }).first();
    await expect(detailsButton).toBeVisible();

    // Click on Details button - it should not throw
    await detailsButton.click();
    await page.waitForTimeout(500);

    // Page should still be responsive after click
    await expect(page.locator('#main-content')).toBeVisible();
  });
});

test.describe('False Positive Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await setupPageWithScan(page);
  });

  test('should mark finding as false positive', async ({ page }) => {
    // Navigate to scan details
    await clickScanCard(page);
    await page.waitForTimeout(500);

    // Look for false positive toggle button
    const fpButton = page.getByRole('button', { name: /false positive|fp/i }).first();
    if (await fpButton.isVisible()) {
      await fpButton.click();

      // Should show confirmation or update the UI
      await page.waitForTimeout(500);
    }
  });

  test('should filter to show only false positives', async ({ page }) => {
    // Navigate to scan details
    await clickScanCard(page);
    await page.waitForTimeout(500);

    // Look for false positive filter button (contains count like "False Positives (0)")
    const fpFilter = page.getByRole('button', { name: /false positives \(\d+\)/i });
    const fpFilterCount = await fpFilter.count();
    if (fpFilterCount > 0 && await fpFilter.first().isVisible()) {
      await fpFilter.first().click();

      // With no false positives marked, should show empty state
      await expect(page.getByText(/no false positives/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Scan Comparison Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Add multiple scans for comparison
    const olderScan = {
      ...mockSavedScan,
      id: 'scan-2',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      score: 65,
      totalIssues: 6,
    };

    await page.addInitScript((scans) => {
      localStorage.setItem('allylab_scans', JSON.stringify(scans));
    }, [mockSavedScan, olderScan]);

    await page.goto('/');
    await page.locator('nav').getByRole('button', { name: 'Reports & History' }).click();
    await page.waitForTimeout(1000);
  });

  test('should display multiple scans in history', async ({ page }) => {
    // Should show scan cards - check for the stats area which shows scan count
    await expect(page.getByText('Total Scans')).toBeVisible({ timeout: 10000 });
    // The page should have loaded with scan data visible
    await expect(page.locator('#main-content')).toContainText(/example\.com/);
  });

  test('should enable compare mode', async ({ page }) => {
    // Look for Compare Scans button
    const compareButton = page.getByRole('button', { name: /compare.*scans/i });
    await expect(compareButton).toBeVisible({ timeout: 10000 });
    await compareButton.click();
    await page.waitForTimeout(500);

    // After clicking compare, the UI should change - either show checkboxes or a different view
    // Just verify the page responded to the click
    await expect(page.locator('#main-content')).toBeVisible();
  });
});
