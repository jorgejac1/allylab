import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';
import type { Finding } from '../types/index.js';

const client = config.enableAiFixes ? new Anthropic() : null;

export async function generateFix(finding: Finding): Promise<string | null> {
  if (!client) {
    return null;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are an accessibility expert. Provide a concise fix for this accessibility issue.

Rule: ${finding.ruleTitle}
Description: ${finding.description}
HTML: ${finding.html}
Selector: ${finding.selector}

Provide ONLY the corrected HTML code, no explanation.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return null;
  } catch (error) {
    console.error('AI fix generation failed:', error);
    return null;
  }
}

export async function generateFixBatch(findings: Finding[]): Promise<Map<string, string>> {
  const fixes = new Map<string, string>();

  if (!client) {
    return fixes;
  }

  // Process in parallel with limit
  const batchSize = 5;
  for (let i = 0; i < findings.length; i += batchSize) {
    const batch = findings.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (finding) => {
        const fix = await generateFix(finding);
        return { id: finding.id, fix };
      })
    );

    for (const { id, fix } of results) {
      if (fix) {
        fixes.set(id, fix);
      }
    }
  }

  return fixes;
}