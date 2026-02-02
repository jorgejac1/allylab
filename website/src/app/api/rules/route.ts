/**
 * Custom Rules API
 *
 * Manages custom accessibility rules for organizations.
 */

import { NextRequest, NextResponse } from 'next/server';

interface CustomRule {
  id: string;
  name: string;
  description: string;
  selector: string;
  check: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  tags: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for demo (in production, use database)
const rulesStore: Map<string, CustomRule> = new Map([
  ['rule-1', {
    id: 'rule-1',
    name: 'Brand Color Contrast',
    description: 'Ensure brand colors meet WCAG AA contrast requirements',
    selector: '.brand-text, .brand-bg',
    check: 'color-contrast >= 4.5',
    impact: 'serious',
    tags: ['wcag2aa', 'color', 'brand'],
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }],
  ['rule-2', {
    id: 'rule-2',
    name: 'Product Image Alt',
    description: 'All product images must have descriptive alt text',
    selector: 'img.product-image',
    check: 'has-alt && alt-length > 10',
    impact: 'critical',
    tags: ['wcag2a', 'images', 'products'],
    enabled: true,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  }],
  ['rule-3', {
    id: 'rule-3',
    name: 'Form Field Labels',
    description: 'All checkout form fields must have visible labels',
    selector: '.checkout-form input, .checkout-form select',
    check: 'has-visible-label',
    impact: 'critical',
    tags: ['wcag2a', 'forms', 'checkout'],
    enabled: false,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  }],
]);

export async function GET() {
  const rules = Array.from(rulesStore.values());
  return NextResponse.json({ data: rules });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, selector, check, impact, tags, enabled = true } = body;

    if (!name || !selector || !check) {
      return NextResponse.json(
        { error: 'Name, selector, and check are required' },
        { status: 400 }
      );
    }

    const id = `rule-${Date.now()}`;
    const now = new Date().toISOString();

    const rule: CustomRule = {
      id,
      name,
      description: description || '',
      selector,
      check,
      impact: impact || 'moderate',
      tags: tags || [],
      enabled,
      createdAt: now,
      updatedAt: now,
    };

    rulesStore.set(id, rule);

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create rule' },
      { status: 500 }
    );
  }
}
