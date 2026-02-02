/**
 * Custom Rules Import API
 *
 * Imports custom rules from JSON.
 */

import { NextRequest, NextResponse } from 'next/server';

interface ImportedRule {
  name: string;
  description?: string;
  selector: string;
  check: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor';
  tags?: string[];
  enabled?: boolean;
}

interface ImportData {
  version?: string;
  rules: ImportedRule[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportData = await request.json();
    const { rules } = body;

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Invalid import format. Expected { rules: [...] }' },
        { status: 400 }
      );
    }

    if (rules.length === 0) {
      return NextResponse.json(
        { error: 'No rules to import' },
        { status: 400 }
      );
    }

    // Validate rules
    const errors: string[] = [];
    const validRules: ImportedRule[] = [];

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      if (!rule.name) {
        errors.push(`Rule ${i + 1}: name is required`);
        continue;
      }

      if (!rule.selector) {
        errors.push(`Rule ${i + 1}: selector is required`);
        continue;
      }

      if (!rule.check) {
        errors.push(`Rule ${i + 1}: check is required`);
        continue;
      }

      validRules.push(rule);
    }

    if (validRules.length === 0) {
      return NextResponse.json(
        { error: 'No valid rules found', details: errors },
        { status: 400 }
      );
    }

    // In production: save rules to database
    // For demo, just return success

    const importedRules = validRules.map((rule, index) => ({
      id: `rule-imported-${Date.now()}-${index}`,
      name: rule.name,
      description: rule.description || '',
      selector: rule.selector,
      check: rule.check,
      impact: rule.impact || 'moderate',
      tags: rule.tags || [],
      enabled: rule.enabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      imported: importedRules.length,
      skipped: rules.length - validRules.length,
      errors: errors.length > 0 ? errors : undefined,
      rules: importedRules,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
