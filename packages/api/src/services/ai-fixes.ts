import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';
import type { Finding } from '../types/index.js';
import type { CodeFix, FixGenerationRequest, FrameworkType } from '../types/fixes.js';

const client = config.enableAiFixes ? new Anthropic({ apiKey: config.anthropicApiKey }) : null;

function generateId(): string {
  return `fix_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createDiff(original: string, fixed: string): string {
  const originalLines = original.split('\n');
  const fixedLines = fixed.split('\n');
  
  let diff = '';
  const maxLines = Math.max(originalLines.length, fixedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i];
    const fixedLine = fixedLines[i];
    
    if (origLine === fixedLine) {
      diff += `  ${origLine || ''}\n`;
    } else {
      if (origLine !== undefined) {
        diff += `- ${origLine}\n`;
      }
      if (fixedLine !== undefined) {
        diff += `+ ${fixedLine}\n`;
      }
    }
  }
  
  return diff.trim();
}

function estimateEffort(ruleId: string, html: string): 'trivial' | 'easy' | 'medium' | 'complex' {
  // Trivial: Simple attribute additions
  const trivialRules = ['image-alt', 'button-name', 'input-label', 'link-name'];
  if (trivialRules.some(r => ruleId.includes(r))) return 'trivial';
  
  // Easy: Single element changes
  const easyRules = ['color-contrast', 'focus-visible', 'aria-label'];
  if (easyRules.some(r => ruleId.includes(r))) return 'easy';
  
  // Complex: Structural changes
  const complexRules = ['landmark', 'heading-order', 'bypass', 'keyboard'];
  if (complexRules.some(r => ruleId.includes(r))) return 'complex';
  
  // Use HTML length as a factor for medium complexity estimation
  // Longer HTML typically means more complex fixes
  if (html.length > 500) return 'medium';
  
  return 'medium';
}

function estimateConfidence(ruleId: string): 'high' | 'medium' | 'low' {
  // High confidence for simple fixes
  const highConfidenceRules = ['image-alt', 'button-name', 'input-label', 'link-name', 'html-lang'];
  if (highConfidenceRules.some(r => ruleId.includes(r))) return 'high';
  
  // Low confidence for complex/contextual fixes
  const lowConfidenceRules = ['color-contrast', 'landmark', 'heading-order'];
  if (lowConfidenceRules.some(r => ruleId.includes(r))) return 'low';
  
  return 'medium';
}

function getFrameworkPrompt(framework: FrameworkType): string {
  switch (framework) {
    case 'react':
      return 'Focus on React JSX syntax with className instead of class, and proper JSX attribute formatting.';
    case 'vue':
      return 'Focus on Vue template syntax with v-bind directives where appropriate.';
    case 'angular':
      return 'Focus on Angular template syntax with property binding where appropriate.';
    case 'html':
    default:
      return 'Use standard HTML5 syntax.';
  }
}

export async function generateEnhancedFix(request: FixGenerationRequest): Promise<CodeFix | null> {
  if (!client) {
    console.log('[AI Fixes] AI fixes disabled - no API key configured');
    return null;
  }

  const { finding, framework = 'html' } = request;
  const frameworkHint = getFrameworkPrompt(framework);

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are an accessibility expert and frontend developer. Generate fixes for this accessibility issue.

## Issue Details
- Rule: ${finding.ruleTitle} (${finding.ruleId})
- Description: ${finding.description}
- Impact: ${finding.impact}
- WCAG: ${finding.wcagTags.join(', ')}

## Current HTML
\`\`\`html
${finding.html}
\`\`\`

## Selector
${finding.selector}

## Framework Preference
${frameworkHint}

## Instructions
Provide fixes in JSON format with:
1. Fixed HTML code
2. Fixed React JSX code (if applicable)
3. Brief explanation of the fix
4. Any additional notes

Respond ONLY with valid JSON in this exact format:
{
  "html": "<fixed html code>",
  "react": "<fixed JSX code or null if not applicable>",
  "explanation": "<1-2 sentence explanation>",
  "notes": "<any additional considerations>"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return null;
    }

    // Parse JSON response
    let parsed: { html: string; react?: string; vue?: string; explanation: string; notes?: string };
    try {
      // Extract JSON from potential markdown code blocks
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      parsed = JSON.parse(jsonText.trim());
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      console.error('[AI Fixes] Failed to parse AI response as JSON:', errorMessage, content.text);
      // Fallback: treat entire response as HTML fix
      return {
        id: generateId(),
        findingId: finding.ruleId,
        ruleId: finding.ruleId,
        original: {
          code: finding.html,
          selector: finding.selector,
          language: framework,
        },
        fixes: {
          html: content.text,
        },
        diff: createDiff(finding.html, content.text),
        explanation: 'AI-generated fix for accessibility issue',
        confidence: estimateConfidence(finding.ruleId),
        effort: estimateEffort(finding.ruleId, finding.html),
        wcagCriteria: finding.wcagTags,
        createdAt: new Date().toISOString(),
      };
    }

    const fix: CodeFix = {
      id: generateId(),
      findingId: finding.ruleId,
      ruleId: finding.ruleId,
      original: {
        code: finding.html,
        selector: finding.selector,
        language: framework,
      },
      fixes: {
        html: parsed.html,
        react: parsed.react || undefined,
        vue: parsed.vue || undefined,
      },
      diff: createDiff(finding.html, parsed.html),
      explanation: parsed.explanation + (parsed.notes ? `\n\n${parsed.notes}` : ''),
      confidence: estimateConfidence(finding.ruleId),
      effort: estimateEffort(finding.ruleId, finding.html),
      wcagCriteria: finding.wcagTags,
      createdAt: new Date().toISOString(),
    };

    console.log(`[AI Fixes] Generated ${framework} fix for ${finding.ruleId} with ${fix.confidence} confidence`);
    return fix;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Fixes] Fix generation failed:', errorMessage);
    return null;
  }
}

// Legacy function for backwards compatibility
export async function generateFix(finding: Finding): Promise<string | null> {
  const result = await generateEnhancedFix({
    finding: {
      ruleId: finding.ruleId,
      ruleTitle: finding.ruleTitle,
      description: finding.description,
      html: finding.html,
      selector: finding.selector,
      wcagTags: finding.wcagTags,
      impact: finding.impact,
    },
  });

  return result?.fixes.html || null;
}

export async function generateFixBatch(findings: Finding[]): Promise<Map<string, string>> {
  const fixes = new Map<string, string>();

  if (!client) {
    return fixes;
  }

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