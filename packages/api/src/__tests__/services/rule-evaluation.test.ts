import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Page } from "playwright";

// Mock the rules route
vi.mock("../../routes/rules", () => ({
  getEnabledRules: vi.fn(),
}));

import {
  evaluateCustomRules,
  getEnabledRulesCount,
} from "../../services/rule-evaluator";
import { getEnabledRules } from "../../routes/rules";
import type { CustomRule } from "../../types/rules";

const mockGetEnabledRules = vi.mocked(getEnabledRules);

/**
 * Mock Page interface for testing
 */
interface MockPage {
  $$: ReturnType<typeof vi.fn>;
  $: ReturnType<typeof vi.fn>;
}

/**
 * Helper to create a valid CustomRule with required fields
 */
function createMockRule(
  overrides: Partial<CustomRule> &
    Pick<
      CustomRule,
      "id" | "name" | "type" | "selector" | "condition" | "message" | "severity"
    >
): CustomRule {
  const now = new Date().toISOString();
  return {
    description: "Test description",
    wcagTags: [],
    enabled: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("services/rule-evaluator", () => {
  let mockPage: MockPage;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = {
      $$: vi.fn().mockResolvedValue([]),
      $: vi.fn().mockResolvedValue(null),
    };

    mockGetEnabledRules.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("evaluateCustomRules", () => {
    it("returns empty array when no rules enabled", async () => {
      mockGetEnabledRules.mockReturnValue([]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toEqual([]);
    });

    describe("selector rules", () => {
      it("detects violation when element exists (exists operator)", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "No inline styles",
          description: "Elements should not have inline styles",
          type: "selector",
          selector: "[style]",
          condition: { operator: "exists" },
          message: "Found inline style",
          severity: "moderate",
          wcagTags: ["wcag2a"],
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          evaluate: vi.fn().mockResolvedValue('<div style="color:red">'),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(violations[0].ruleId).toBe("rule-1");
        expect(violations[0].severity).toBe("moderate");
      });

      // Change this test:
      it("detects violation when element does not exist (not-exists operator)", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "Must have skip link",
          description: "Page must have a skip link",
          type: "selector",
          selector: 'a[href="#main"]',
          condition: { operator: "not-exists" },
          message: "Missing skip link",
          severity: "serious",
          wcagTags: ["wcag2a"],
        });

        mockGetEnabledRules.mockReturnValue([rule]);
        mockPage.$$.mockResolvedValue([]); // No elements found

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        // The actual implementation generates its own message format
        expect(violations[0].message).toContain('a[href="#main"]');
      });
    });

    describe("attribute rules", () => {
      it("detects missing required attribute", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "Images need alt",
          description: "All images must have alt attribute",
          type: "attribute",
          selector: "img",
          condition: {
            attribute: "alt",
            operator: "not-exists",
          },
          message: "Image missing alt attribute",
          severity: "critical",
          wcagTags: ["wcag2a", "wcag111"],
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          getAttribute: vi.fn().mockResolvedValue(null),
          evaluate: vi.fn().mockResolvedValue('<img src="photo.jpg">'),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(violations[0].severity).toBe("critical");
      });

      it("detects attribute with wrong value", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "No target blank",
          description: "Links should not open in new tab",
          type: "attribute",
          selector: "a",
          condition: {
            attribute: "target",
            operator: "equals",
            value: "_blank",
          },
          message: "Link opens in new tab",
          severity: "minor",
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          getAttribute: vi.fn().mockResolvedValue("_blank"),
          evaluate: vi.fn().mockResolvedValue('<a target="_blank">'),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
      });

      it("detects attribute containing specific value", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "No javascript URLs",
          description: "Links should not use javascript: protocol",
          type: "attribute",
          selector: "a",
          condition: {
            attribute: "href",
            operator: "contains",
            value: "javascript:",
          },
          message: "Link uses javascript: protocol",
          severity: "serious",
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          getAttribute: vi.fn().mockResolvedValue("javascript:void(0)"),
          evaluate: vi.fn().mockResolvedValue('<a href="javascript:void(0)">'),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
      });

      it("detects attribute matching pattern", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "Valid ID format",
          description: "IDs should follow naming convention",
          type: "attribute",
          selector: "[id]",
          condition: {
            attribute: "id",
            operator: "matches",
            value: "^[0-9]", // IDs starting with number
          },
          message: "ID starts with number",
          severity: "minor",
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          getAttribute: vi.fn().mockResolvedValue("123-element"),
          evaluate: vi.fn().mockResolvedValue('<div id="123-element">'),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
      });
    });

    describe("content rules", () => {
      it("detects content below minimum length", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "Button text length",
          description: "Buttons should have meaningful text",
          type: "content",
          selector: "button",
          condition: {
            minLength: 3,
          },
          message: "Button text too short",
          severity: "moderate",
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          textContent: vi.fn().mockResolvedValue("OK"),
          evaluate: vi.fn().mockResolvedValue("<button>OK</button>"),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
      });

      it("detects content above maximum length", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "Alt text length",
          description: "Alt text should not be too long",
          type: "content",
          selector: "img[alt]",
          condition: {
            maxLength: 100,
          },
          message: "Alt text too long",
          severity: "minor",
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          textContent: vi.fn().mockResolvedValue("A".repeat(150)),
          evaluate: vi.fn().mockResolvedValue('<img alt="...">'),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
      });

      it("detects content matching forbidden pattern", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "No placeholder text",
          description: "Should not have placeholder text",
          type: "content",
          selector: "p",
          condition: {
            pattern: "Lorem ipsum", // Match exact case
          },
          message: "Contains placeholder text",
          severity: "minor",
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          textContent: vi.fn().mockResolvedValue("Lorem ipsum dolor sit amet"),
          evaluate: vi.fn().mockResolvedValue("<p>Lorem ipsum...</p>"),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
      });
    });

    describe("structure rules", () => {
      it("detects missing required parent", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "List items in list",
          description: "List items must be inside a list",
          type: "structure",
          selector: "li",
          condition: {
            parent: "ul, ol",
          },
          message: "List item not in list",
          severity: "serious",
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          evaluate: vi
            .fn()
            .mockResolvedValueOnce("<li>Item</li>")
            .mockResolvedValueOnce(false), // No parent found
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
      });

      it("detects missing required children", async () => {
        const rule = createMockRule({
          id: "rule-1",
          name: "Forms need fieldsets",
          description: "Forms should contain fieldsets",
          type: "structure",
          selector: "form",
          condition: {
            children: "fieldset",
          },
          message: "Form missing fieldset",
          severity: "moderate",
        });

        mockGetEnabledRules.mockReturnValue([rule]);

        const mockElement = {
          evaluate: vi
            .fn()
            .mockResolvedValueOnce("<form>...</form>")
            .mockResolvedValueOnce(false), // No children found
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
      });
    });

    it("calls onViolation callback for each violation", async () => {
      const rule = createMockRule({
        id: "rule-1",
        name: "Test rule",
        description: "Test",
        type: "selector",
        selector: "div",
        condition: { operator: "exists" },
        message: "Found div",
        severity: "minor",
      });

      mockGetEnabledRules.mockReturnValue([rule]);

      const mockElement = {
        evaluate: vi.fn().mockResolvedValue("<div>"),
      };
      mockPage.$$.mockResolvedValue([mockElement, mockElement]);

      const onViolation = vi.fn();

      await evaluateCustomRules({
        page: mockPage as unknown as Page,
        onViolation,
      });

      expect(onViolation).toHaveBeenCalledTimes(2);
    });

    it("handles rule evaluation errors gracefully", async () => {
      const rule = createMockRule({
        id: "rule-1",
        name: "Broken rule",
        description: "This rule will fail",
        type: "selector",
        selector: "div",
        condition: { operator: "exists" },
        message: "Test",
        severity: "minor",
      });

      mockGetEnabledRules.mockReturnValue([rule]);
      mockPage.$$.mockRejectedValue(new Error("Page closed"));

      // Should not throw
      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toEqual([]);
    });
  });

  describe("getEnabledRulesCount", () => {
    it("returns 0 when no rules enabled", () => {
      mockGetEnabledRules.mockReturnValue([]);

      const count = getEnabledRulesCount();

      expect(count).toBe(0);
    });

    it("returns correct count of enabled rules", () => {
      const rules = [
        createMockRule({
          id: "1",
          name: "Rule 1",
          type: "selector",
          selector: "div",
          condition: { operator: "exists" },
          message: "Test",
          severity: "minor",
        }),
        createMockRule({
          id: "2",
          name: "Rule 2",
          type: "selector",
          selector: "span",
          condition: { operator: "exists" },
          message: "Test",
          severity: "minor",
        }),
        createMockRule({
          id: "3",
          name: "Rule 3",
          type: "selector",
          selector: "p",
          condition: { operator: "exists" },
          message: "Test",
          severity: "minor",
        }),
      ];

      mockGetEnabledRules.mockReturnValue(rules);

      const count = getEnabledRulesCount();

      expect(count).toBe(3);
    });
  });

  describe("attribute rules extended", () => {
    it("detects attribute not equals value", async () => {
      const rule = createMockRule({
        id: "rule-1",
        name: "Type should be submit",
        type: "attribute",
        selector: "button",
        condition: {
          attribute: "type",
          operator: "not-equals",
          value: "submit",
        },
        message: "Button type is not submit",
        severity: "minor",
      });

      mockGetEnabledRules.mockReturnValue([rule]);

      const mockElement = {
        getAttribute: vi.fn().mockResolvedValue("button"),
        evaluate: vi.fn().mockResolvedValue('<button type="button">'),
      };
      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(1);
    });
  });

  describe("structure rules extended", () => {
    it("detects missing siblings", async () => {
      const rule = createMockRule({
        id: "rule-1",
        name: "Input needs label sibling",
        type: "structure",
        selector: "input",
        condition: {
          siblings: "label",
        },
        message: "Input missing label sibling",
        severity: "serious",
      });

      mockGetEnabledRules.mockReturnValue([rule]);

      const mockElement = {
        evaluate: vi
          .fn()
          .mockResolvedValueOnce("<input>")
          .mockResolvedValueOnce(false), // No sibling found
      };
      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(1);
    });
  });

  describe("unknown rule type", () => {
    it("returns empty array for unknown rule type", async () => {
      const rule = createMockRule({
        id: "rule-1",
        name: "Unknown rule",
        type: "unknown" as "selector", // Force unknown type
        selector: "div",
        condition: {},
        message: "Test",
        severity: "minor",
      });

      mockGetEnabledRules.mockReturnValue([rule]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toEqual([]);
    });
  });
});
