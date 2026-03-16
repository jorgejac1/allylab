import { describe, it, expect, vi } from 'vitest';
import { evaluateTVRules, TV_RULES } from '../../rules/tv-accessibility';

describe('TV Accessibility Rules', () => {
  // Helper to create a mock page
  function createMockPage(evaluateResult: unknown) {
    return {
      evaluate: vi.fn().mockResolvedValue(evaluateResult),
      url: vi.fn().mockReturnValue('https://example.com'),
    };
  }

  it('should define 7 TV-specific rules', () => {
    expect(TV_RULES).toHaveLength(7);
  });

  it('should return empty findings for compliant pages', async () => {
    const page = createMockPage([]);
    const findings = await evaluateTVRules(page);
    expect(findings).toHaveLength(0);
  });

  it('should detect focus visibility violations', async () => {
    const page = createMockPage([
      {
        ruleId: 'tv-focus-visibility',
        elements: [
          { selector: 'button#submit', html: '<button id="submit">Submit</button>', issue: 'Focus outline is removed' },
        ],
      },
    ]);
    const findings = await evaluateTVRules(page);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('tv-focus-visibility');
    expect(findings[0].source).toBe('tv-rule');
    expect(findings[0].impact).toBe('critical');
  });

  it('should detect target size violations', async () => {
    const page = createMockPage([
      {
        ruleId: 'tv-target-size',
        elements: [
          { selector: 'button', html: '<button>Click</button>', issue: 'Element is 30x20px (minimum 44x44px for TV)' },
        ],
      },
    ]);
    const findings = await evaluateTVRules(page);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('tv-target-size');
    expect(findings[0].impact).toBe('serious');
  });

  it('should detect font size violations', async () => {
    const page = createMockPage([
      {
        ruleId: 'tv-font-size',
        elements: [
          { selector: 'p', html: '<p>Small text</p>', issue: 'Font size is 12px (minimum 16px for TV viewing distance)' },
        ],
      },
    ]);
    const findings = await evaluateTVRules(page);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('tv-font-size');
  });

  it('should detect auto-play media violations', async () => {
    const page = createMockPage([
      {
        ruleId: 'tv-autoplay-media',
        elements: [
          { selector: 'video', html: '<video autoplay src="video.mp4">', issue: 'Media auto-plays without being muted' },
        ],
      },
    ]);
    const findings = await evaluateTVRules(page);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe('tv-autoplay-media');
    expect(findings[0].impact).toBe('critical');
  });

  it('should handle multiple rule violations', async () => {
    const page = createMockPage([
      {
        ruleId: 'tv-focus-visibility',
        elements: [{ selector: 'a', html: '<a>Link</a>', issue: 'outline removed' }],
      },
      {
        ruleId: 'tv-target-size',
        elements: [
          { selector: 'button', html: '<button>A</button>', issue: 'too small' },
          { selector: 'a', html: '<a>B</a>', issue: 'too small' },
        ],
      },
    ]);
    const findings = await evaluateTVRules(page);
    expect(findings).toHaveLength(3);
  });

  it('should set correct WCAG tags on findings', async () => {
    const page = createMockPage([
      {
        ruleId: 'tv-reading-order',
        elements: [{ selector: 'div', html: '<div>Content</div>', issue: 'order issue' }],
      },
    ]);
    const findings = await evaluateTVRules(page);
    expect(findings[0].wcagTags).toContain('wcag132');
    expect(findings[0].wcagTags).toContain('wcag243');
  });
});
