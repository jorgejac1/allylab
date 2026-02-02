/**
 * Custom Rules Export API
 *
 * Exports all custom rules as JSON.
 */

import { NextResponse } from 'next/server';

// Mock rules data (in production, fetch from database)
const MOCK_RULES = [
  {
    id: 'rule-1',
    name: 'Brand Color Contrast',
    description: 'Ensure brand colors meet WCAG AA contrast requirements',
    selector: '.brand-text, .brand-bg',
    check: 'color-contrast >= 4.5',
    impact: 'serious',
    tags: ['wcag2aa', 'color', 'brand'],
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'Product Image Alt',
    description: 'All product images must have descriptive alt text',
    selector: 'img.product-image',
    check: 'has-alt && alt-length > 10',
    impact: 'critical',
    tags: ['wcag2a', 'images', 'products'],
    enabled: true,
  },
  {
    id: 'rule-3',
    name: 'Form Field Labels',
    description: 'All checkout form fields must have visible labels',
    selector: '.checkout-form input, .checkout-form select',
    check: 'has-visible-label',
    impact: 'critical',
    tags: ['wcag2a', 'forms', 'checkout'],
    enabled: false,
  },
];

export async function GET() {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rules: MOCK_RULES.map(({ id: _id, ...rule }) => rule), // Remove IDs for export
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="allylab-rules.json"',
    },
  });
}
