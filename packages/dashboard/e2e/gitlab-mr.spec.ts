import { test, expect, Page } from '@playwright/test';

// Mock scan with findings that have associated GitLab MRs
const mockScan = {
  id: 'scan-gl-1',
  url: 'https://example.com',
  timestamp: new Date().toISOString(),
  score: 68,
  totalIssues: 3,
  critical: 1,
  serious: 1,
  moderate: 1,
  minor: 0,
  scanDuration: 3000,
  trackedFindings: [
    {
      id: 'gl-f1',
      ruleId: 'color-contrast',
      ruleTitle: 'Color contrast insufficient',
      description: 'Text does not have sufficient contrast',
      impact: 'serious',
      selector: '.low-contrast-text',
      html: '<span class="low-contrast-text">Hard to read</span>',
      helpUrl: 'https://example.com/help',
      wcagTags: ['wcag2aa', 'wcag143'],
      fingerprint: 'fp-gl-1',
      status: 'new',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'gl-f2',
      ruleId: 'image-alt',
      ruleTitle: 'Images must have alt text',
      description: 'Image is missing alt attribute',
      impact: 'critical',
      selector: 'img.hero',
      html: '<img class="hero" src="/img.jpg">',
      helpUrl: 'https://example.com/help',
      wcagTags: ['wcag2a', 'wcag111'],
      fingerprint: 'fp-gl-2',
      status: 'new',
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'gl-f3',
      ruleId: 'label',
      ruleTitle: 'Form elements must have labels',
      description: 'Input is missing associated label',
      impact: 'moderate',
      selector: 'input#email',
      html: '<input id="email" type="email">',
      helpUrl: 'https://example.com/help',
      wcagTags: ['wcag2a', 'wcag412'],
      fingerprint: 'fp-gl-3',
      status: 'recurring',
      firstSeen: new Date(Date.now() - 86400000).toISOString(),
      lastSeen: new Date().toISOString(),
    },
  ],
};

// Mock tracked GitLab MRs linked to findings
const mockTrackedMRs = [
  {
    id: 'mr_101_1',
    findingIds: ['gl-f1'],
    projectPath: 'acme/frontend',
    mrIid: 101,
    mrUrl: 'https://gitlab.com/acme/frontend/-/merge_requests/101',
    sourceBranch: 'fix/color-contrast',
    targetBranch: 'main',
    status: 'opened',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mr_102_2',
    findingIds: ['gl-f2'],
    projectPath: 'acme/frontend',
    mrIid: 102,
    mrUrl: 'https://gitlab.com/acme/frontend/-/merge_requests/102',
    sourceBranch: 'fix/image-alt',
    targetBranch: 'main',
    status: 'merged',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mr_103_3',
    findingIds: ['gl-f3'],
    projectPath: 'acme/frontend',
    mrIid: 103,
    mrUrl: 'https://gitlab.com/acme/frontend/-/merge_requests/103',
    sourceBranch: 'fix/form-labels',
    targetBranch: 'main',
    status: 'closed',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

async function setupPageWithMRs(page: Page) {
  await page.addInitScript((data) => {
    localStorage.setItem('allylab_scans', JSON.stringify([data.scan]));
    localStorage.setItem('allylab_tracked_mrs_gitlab', JSON.stringify(data.mrs));
    localStorage.setItem('allylab_false_positives', JSON.stringify([]));
    localStorage.setItem('allylab_jira_links', JSON.stringify({}));
    localStorage.setItem('allylab_current_user', 'user_admin');
  }, { scan: mockScan, mrs: mockTrackedMRs });

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

test.describe('GitLab MR Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupPageWithMRs(page);
    await clickScanCard(page);
  });

  test('should display findings with MR status badges', async ({ page }) => {
    // Verify the findings table is rendered
    await expect(page.getByText('Color contrast insufficient')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Images must have alt text')).toBeVisible();
    await expect(page.getByText('Form elements must have labels')).toBeVisible();
  });

  test('should show MR Open badge for opened MR', async ({ page }) => {
    // The first finding (gl-f1) has an opened MR
    await expect(page.getByText('MR Open')).toBeVisible({ timeout: 10000 });
  });

  test('should show MR Merged badge for merged MR', async ({ page }) => {
    // The second finding (gl-f2) has a merged MR
    await expect(page.getByText('MR Merged')).toBeVisible({ timeout: 10000 });
  });

  test('should show MR Closed badge for closed MR', async ({ page }) => {
    // The third finding (gl-f3) has a closed MR
    await expect(page.getByText('MR Closed')).toBeVisible({ timeout: 10000 });
  });

  test('should render MR badges as links to GitLab', async ({ page }) => {
    // MR badges should be links pointing to GitLab MR URLs
    const mrLinks = page.locator('a[href*="gitlab.com"]');
    await page.waitForTimeout(1000);
    const count = await mrLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should show Verify Fix button for merged MRs', async ({ page }) => {
    // Merged MRs without verification status should show a Verify Fix button
    const verifyButton = page.getByRole('button', { name: /verify fix/i });
    await page.waitForTimeout(1000);
    const count = await verifyButton.count();

    // At least one merged MR should have a Verify Fix button
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
