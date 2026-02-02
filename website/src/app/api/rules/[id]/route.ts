/**
 * Custom Rule API - Individual Rule Operations
 *
 * GET, PUT, DELETE operations for a specific rule.
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

// Shared in-memory store (in production, use database)
// Note: In real app, this would be imported from a shared module
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const rule = rulesStore.get(id);
  if (!rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  return NextResponse.json(rule);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingRule = rulesStore.get(id);
    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, selector, check, impact, tags, enabled } = body;

    const updatedRule: CustomRule = {
      ...existingRule,
      name: name ?? existingRule.name,
      description: description ?? existingRule.description,
      selector: selector ?? existingRule.selector,
      check: check ?? existingRule.check,
      impact: impact ?? existingRule.impact,
      tags: tags ?? existingRule.tags,
      enabled: enabled ?? existingRule.enabled,
      updatedAt: new Date().toISOString(),
    };

    rulesStore.set(id, updatedRule);

    return NextResponse.json(updatedRule);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const rule = rulesStore.get(id);
  if (!rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  rulesStore.delete(id);

  return NextResponse.json({ success: true });
}
