import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Finding } from "../../types/index";

// Use vi.hoisted to properly hoist the mock function
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

// Mock the config first
vi.mock("../../config/env.js", () => ({
  config: {
    enableAiFixes: true,
  },
}));

// Mock Anthropic - class must be defined inside the factory
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
    },
  };
});

import {
  generateEnhancedFix,
  generateFix,
  generateFixBatch,
} from "../../services/ai-fixes";

describe("services/ai-fixes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockFinding = {
    ruleId: "image-alt",
    ruleTitle: "Images must have alternate text",
    description: "Ensures <img> elements have alternate text.",
    html: '<img src="photo.jpg">',
    selector: "img",
    wcagTags: ["wcag2a", "wcag111"],
    impact: "critical" as const,
  };

  describe("generateEnhancedFix", () => {
    it("generates fix with valid JSON response", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<img src="photo.jpg" alt="Description">',
              react: '<img src="photo.jpg" alt="Description" />',
              explanation: "Added alt attribute for accessibility.",
              notes: "Consider using more descriptive text.",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).not.toBeNull();
      expect(result?.fixes.html).toBe(
        '<img src="photo.jpg" alt="Description">'
      );
      expect(result?.fixes.react).toBe(
        '<img src="photo.jpg" alt="Description" />'
      );
      expect(result?.explanation).toContain("Added alt attribute");
      expect(result?.id).toMatch(/^fix_/);
    });

    it("handles JSON wrapped in markdown code blocks", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '```json\n{"html": "<img alt=\\"test\\">", "explanation": "Fixed"}\n```',
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).not.toBeNull();
      expect(result?.fixes.html).toBe('<img alt="test">');
    });

    it("falls back to raw response when JSON parsing fails", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '<img src="photo.jpg" alt="Fixed image">',
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).not.toBeNull();
      expect(result?.fixes.html).toBe(
        '<img src="photo.jpg" alt="Fixed image">'
      );
      expect(result?.explanation).toBe(
        "AI-generated fix for accessibility issue"
      );
    });

    it("returns null when API call fails", async () => {
      mockCreate.mockRejectedValue(new Error("API error"));

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).toBeNull();
    });

    it("returns null for non-text content", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "image",
            data: "base64data",
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).toBeNull();
    });
  });

  describe("generateFix", () => {
    it("returns HTML fix for finding", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<img src="photo.jpg" alt="Description">',
              explanation: "Fixed",
            }),
          },
        ],
      });

      const fullFinding: Finding = {
        id: "finding-1",
        ...mockFinding,
        helpUrl: "https://example.com",
      };

      const result = await generateFix(fullFinding);

      expect(result).toBe('<img src="photo.jpg" alt="Description">');
    });

    it("returns null when generation fails", async () => {
      mockCreate.mockRejectedValue(new Error("API error"));

      const fullFinding: Finding = {
        id: "finding-1",
        ...mockFinding,
        helpUrl: "https://example.com",
      };

      const result = await generateFix(fullFinding);

      expect(result).toBeNull();
    });
  });

  describe("utility functions", () => {
    it("estimates effort as complex for structural rules", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<nav>", "explanation": "Fixed"}' },
        ],
      });

      const finding = {
        ...mockFinding,
        ruleId: "landmark-one-main",
        html: "<div>" + "x".repeat(600), // Long HTML for coverage
      };

      const result = await generateEnhancedFix({ finding });
      expect(result?.effort).toBe("complex");
    });

    it("estimates effort as easy for color contrast rules", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<p>", "explanation": "Fixed"}' },
        ],
      });

      const finding = {
        ...mockFinding,
        ruleId: "color-contrast",
      };

      const result = await generateEnhancedFix({ finding });
      expect(result?.effort).toBe("easy");
    });

    it("estimates low confidence for color contrast", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<p>", "explanation": "Fixed"}' },
        ],
      });

      const finding = {
        ...mockFinding,
        ruleId: "color-contrast",
      };

      const result = await generateEnhancedFix({ finding });
      expect(result?.confidence).toBe("low");
    });

    it("uses Vue framework prompt", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<img>", "explanation": "Fixed"}' },
        ],
      });

      await generateEnhancedFix({ finding: mockFinding, framework: "vue" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.stringContaining("Vue"),
            }),
          ],
        })
      );
    });

    it("uses Angular framework prompt", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<img>", "explanation": "Fixed"}' },
        ],
      });

      await generateEnhancedFix({ finding: mockFinding, framework: "angular" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.stringContaining("Angular"),
            }),
          ],
        })
      );
    });

    it("uses React framework prompt", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<img>", "explanation": "Fixed"}' },
        ],
      });

      await generateEnhancedFix({ finding: mockFinding, framework: "react" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.stringContaining("React JSX"),
            }),
          ],
        })
      );
    });
  });

  describe("generateFixBatch", () => {
    it("generates fixes for multiple findings", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<img alt="fixed">',
              explanation: "Fixed",
            }),
          },
        ],
      });

      const findings: Finding[] = [
        { id: "f1", ...mockFinding, helpUrl: "" },
        { id: "f2", ...mockFinding, helpUrl: "" },
        { id: "f3", ...mockFinding, helpUrl: "" },
      ];

      const result = await generateFixBatch(findings);

      expect(result.size).toBe(3);
      expect(result.get("f1")).toBe('<img alt="fixed">');
    });

    it("handles partial failures", async () => {
      mockCreate
        .mockResolvedValueOnce({
          content: [
            { type: "text", text: '{"html": "<fixed1>", "explanation": "ok"}' },
          ],
        })
        .mockRejectedValueOnce(new Error("API error"))
        .mockResolvedValueOnce({
          content: [
            { type: "text", text: '{"html": "<fixed3>", "explanation": "ok"}' },
          ],
        });

      const findings: Finding[] = [
        { id: "f1", ...mockFinding, helpUrl: "" },
        { id: "f2", ...mockFinding, helpUrl: "" },
        { id: "f3", ...mockFinding, helpUrl: "" },
      ];

      const result = await generateFixBatch(findings);

      expect(result.size).toBe(2);
      expect(result.has("f1")).toBe(true);
      expect(result.has("f2")).toBe(false);
      expect(result.has("f3")).toBe(true);
    });
  });

  describe("createDiff", () => {
    it("handles lines that are the same", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<img src="photo.jpg">', // Same as original
              explanation: "No change needed",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      // Diff should show unchanged lines with spaces
      expect(result?.diff).toBeDefined();
    });

    it("handles multiline diffs with additions and removals", async () => {
      const multilineFinding = {
        ...mockFinding,
        html: '<div>\n  <img src="photo.jpg">\n</div>',
      };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<div>\n  <img src="photo.jpg" alt="Description">\n</div>',
              explanation: "Added alt",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: multilineFinding });

      expect(result?.diff).toContain("-");
      expect(result?.diff).toContain("+");
    });
  });

  describe("createDiff edge cases", () => {
    it("handles fixed having more lines than original (addition)", async () => {
      const finding = {
        ...mockFinding,
        html: '<img src="photo.jpg">', // Single line
      };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<img src="photo.jpg"\n     alt="Description">', // Two lines
              explanation: "Added alt on new line",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding });

      expect(result?.diff).toContain("+");
      // The second line should be an addition
      expect(result?.diff).toContain("+ ");
    });

    it("handles original having more lines than fixed (removal)", async () => {
      const finding = {
        ...mockFinding,
        html: '<img src="photo.jpg"\n     class="old-class">', // Two lines
      };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<img src="photo.jpg" alt="Description">', // Single line
              explanation: "Consolidated and added alt",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding });

      expect(result?.diff).toContain("-");
      // Should have a removal line
      expect(result?.diff).toContain("- ");
    });

    it("handles both additions and removals in same diff", async () => {
      // Original: 3 lines, Fixed: 2 lines with changes
      const finding = {
        ...mockFinding,
        html: '<div>\n  <img src="photo.jpg">\n  <span>text</span>\n</div>',
      };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<div>\n  <img src="photo.jpg" alt="Photo">\n</div>',
              explanation: "Added alt, removed span",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding });

      // Should have both additions and removals
      expect(result?.diff).toBeDefined();
      expect(result?.diff).toContain("-");
      expect(result?.diff).toContain("+");
    });

    it("handles empty line in original being equal to undefined in fixed", async () => {
      const finding = {
        ...mockFinding,
        html: "<img>\n\n</img>", // Has empty middle line
      };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: "<img>\n\n</img>", // Same - empty middle line preserved
              explanation: "No change needed",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding });

      expect(result?.diff).toBeDefined();
      // When original equals fixed, diff should not have + or - prefixes for changes
      expect(result?.diff).not.toContain("+ ");
      expect(result?.diff).not.toContain("- ");
    });
  });

  describe("estimateEffort", () => {
    it("returns trivial for button-name rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '{"html": "<button>Click</button>", "explanation": "Fixed"}',
          },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "button-name" },
      });

      expect(result?.effort).toBe("trivial");
    });

    it("returns trivial for input-label rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<input>", "explanation": "Fixed"}' },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "input-label" },
      });

      expect(result?.effort).toBe("trivial");
    });

    it("returns trivial for link-name rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '{"html": "<a>Link</a>", "explanation": "Fixed"}',
          },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "link-name" },
      });

      expect(result?.effort).toBe("trivial");
    });

    it("returns easy for focus-visible rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '{"html": "<button>", "explanation": "Fixed"}',
          },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "focus-visible" },
      });

      expect(result?.effort).toBe("easy");
    });

    it("returns easy for aria-label rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<div>", "explanation": "Fixed"}' },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "aria-label" },
      });

      expect(result?.effort).toBe("easy");
    });

    it("returns complex for heading-order rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<h2>", "explanation": "Fixed"}' },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "heading-order" },
      });

      expect(result?.effort).toBe("complex");
    });

    it("returns complex for bypass rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '{"html": "<a>Skip</a>", "explanation": "Fixed"}',
          },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "bypass" },
      });

      expect(result?.effort).toBe("complex");
    });

    it("returns complex for keyboard rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<div>", "explanation": "Fixed"}' },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "keyboard" },
      });

      expect(result?.effort).toBe("complex");
    });

    it("returns medium for long HTML", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<div>", "explanation": "Fixed"}' },
        ],
      });

      const result = await generateEnhancedFix({
        finding: {
          ...mockFinding,
          ruleId: "some-other-rule",
          html: "<div>" + "x".repeat(600) + "</div>", // Long HTML > 500 chars
        },
      });

      expect(result?.effort).toBe("medium");
    });
  });

  describe("estimateConfidence", () => {
    it("returns high for html-lang rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '{"html": "<html lang=\\"en\\">" , "explanation": "Fixed"}',
          },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "html-lang" },
      });

      expect(result?.confidence).toBe("high");
    });

    it("returns low for landmark rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<main>", "explanation": "Fixed"}' },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "landmark-one-main" },
      });

      expect(result?.confidence).toBe("low");
    });

    it("returns low for heading-order rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<h2>", "explanation": "Fixed"}' },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "heading-order" },
      });

      expect(result?.confidence).toBe("low");
    });

    it("returns medium for unknown rule", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<div>", "explanation": "Fixed"}' },
        ],
      });

      const result = await generateEnhancedFix({
        finding: { ...mockFinding, ruleId: "unknown-rule-xyz" },
      });

      expect(result?.confidence).toBe("medium");
    });
  });

  describe("getFrameworkPrompt", () => {
    it("uses default HTML prompt for html framework", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<img>", "explanation": "Fixed"}' },
        ],
      });

      await generateEnhancedFix({ finding: mockFinding, framework: "html" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.stringContaining("HTML5"),
            }),
          ],
        })
      );
    });
  });

  describe("JSON parsing edge cases", () => {
    it("handles JSON with only closing backticks", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '{"html": "<img alt=\\"test\\">", "explanation": "Fixed"}```',
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).not.toBeNull();
      expect(result?.fixes.html).toBe('<img alt="test">');
    });

    it("handles JSON with just ``` wrapper (no json label)", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '```\n{"html": "<img alt=\\"test\\">", "explanation": "Fixed"}\n```',
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).not.toBeNull();
      expect(result?.fixes.html).toBe('<img alt="test">');
    });

    it("includes vue fix when provided", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<img alt="test">',
              react: '<img alt="test" />',
              vue: '<img :alt="altText" />',
              explanation: "Fixed",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result?.fixes.vue).toBe('<img :alt="altText" />');
    });

    it("appends notes to explanation when provided", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              html: '<img alt="test">',
              explanation: "Added alt attribute",
              notes: "Consider using more descriptive text",
            }),
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result?.explanation).toContain("Added alt attribute");
      expect(result?.explanation).toContain(
        "Consider using more descriptive text"
      );
    });
  });

  describe("generateFixBatch", () => {
    it("processes in batches of 5", async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: "text", text: '{"html": "<fixed>", "explanation": "ok"}' },
        ],
      });

      const findings: Finding[] = Array.from({ length: 7 }, (_, i) => ({
        id: `f${i}`,
        ...mockFinding,
        helpUrl: "",
      }));

      const result = await generateFixBatch(findings);

      // All 7 should be processed
      expect(result.size).toBe(7);
      // Should have been called 7 times (each finding individually)
      expect(mockCreate).toHaveBeenCalledTimes(7);
    });
  });

  describe("error handling edge cases", () => {
    it("handles non-Error parse error (Unknown parse error)", async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: "not valid json {{{",
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      // Should fallback to treating response as HTML
      expect(result).not.toBeNull();
      expect(result?.fixes.html).toBe("not valid json {{{");
      expect(result?.explanation).toBe(
        "AI-generated fix for accessibility issue"
      );
    });

    it("handles non-Error exception in outer catch (Unknown error)", async () => {
      // Make the mock throw a non-Error value
      mockCreate.mockRejectedValue("string error instead of Error object");

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).toBeNull();
    });

    it("handles null thrown in outer catch", async () => {
      mockCreate.mockRejectedValue(null);

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).toBeNull();
    });

    it("handles undefined thrown in outer catch", async () => {
      mockCreate.mockRejectedValue(undefined);

      const result = await generateEnhancedFix({ finding: mockFinding });

      expect(result).toBeNull();
    });

    it("handles non-Error thrown from JSON.parse", async () => {
      vi.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string error, not Error object";
      });

      mockCreate.mockResolvedValue({
        content: [
          {
            type: "text",
            text: '{"html": "test"}',
          },
        ],
      });

      const result = await generateEnhancedFix({ finding: mockFinding });

      // Restore JSON.parse
      vi.mocked(JSON.parse).mockRestore();

      expect(result).not.toBeNull();
      expect(result?.explanation).toBe(
        "AI-generated fix for accessibility issue"
      );
    });
  });

  describe("services/ai-fixes with AI disabled", () => {
    it("returns null from generateEnhancedFix when AI is disabled", async () => {
      // Reset modules to allow re-mocking
      vi.resetModules();

      // Mock config with AI disabled
      vi.doMock("../../config/env.js", () => ({
        config: {
          enableAiFixes: false,
        },
      }));

      // Mock Anthropic (still needed to prevent import errors)
      vi.doMock("@anthropic-ai/sdk", () => ({
        default: class MockAnthropic {
          messages = { create: vi.fn() };
        },
      }));

      // Re-import the module with new mocks
      const { generateEnhancedFix } = await import("../../services/ai-fixes");

      const result = await generateEnhancedFix({
        finding: {
          ruleId: "image-alt",
          ruleTitle: "Images must have alternate text",
          description: "Test",
          html: "<img>",
          selector: "img",
          wcagTags: ["wcag2a"],
          impact: "critical",
        },
      });

      expect(result).toBeNull();
    });

    it("returns empty map from generateFixBatch when AI is disabled", async () => {
      vi.resetModules();

      vi.doMock("../../config/env.js", () => ({
        config: {
          enableAiFixes: false,
        },
      }));

      vi.doMock("@anthropic-ai/sdk", () => ({
        default: class MockAnthropic {
          messages = { create: vi.fn() };
        },
      }));

      const { generateFixBatch } = await import("../../services/ai-fixes");

      const result = await generateFixBatch([
        {
          id: "f1",
          ruleId: "image-alt",
          ruleTitle: "Test",
          description: "Test",
          html: "<img>",
          selector: "img",
          wcagTags: [],
          impact: "critical",
          helpUrl: "",
        },
      ]);

      expect(result.size).toBe(0);
    });
  });
});
