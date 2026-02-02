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

    mockGetEnabledRules.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("evaluateCustomRules", () => {
    it("returns empty array when no rules enabled", async () => {
      mockGetEnabledRules.mockResolvedValue([]);

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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

        mockGetEnabledRules.mockResolvedValue([rule]);
        mockPage.$$.mockResolvedValue([]); // No elements found

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        // The actual implementation generates its own message format
        expect(violations[0].message).toContain('a[href="#main"]');
      });

      it("executes selector HTML extraction callback", async () => {
        const rule = createMockRule({
          id: "rule-cb-selector",
          name: "Selector HTML callback",
          description: "Covers outerHTML slice callback",
          type: "selector",
          selector: "div.test",
          condition: { operator: "exists" },
          message: "Found element",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        const mockElement = {
          evaluate: vi
            .fn()
            .mockImplementation(
              async (cb: (el: { outerHTML: string }) => string) =>
                cb({ outerHTML: "<div class='test'>Hello</div>" })
            ),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(mockElement.evaluate).toHaveBeenCalled();
      });

      it("defaults selector operator to 'exists' when not provided", async () => {
        const rule = createMockRule({
          id: "rule-default-exists",
          name: "Default exists operator",
          description: "Covers condition.operator || 'exists' fallback",
          type: "selector",
          selector: "div.default-exists",
          condition: {} as CustomRule["condition"],
          message: "Div should trigger exists violation",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        const mockElement = {
          evaluate: vi
            .fn()
            .mockResolvedValue("<div class='default-exists'>Hello</div>"),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(violations[0].ruleId).toBe("rule-default-exists");
      });

      it("triggers selector exists branch when elements are present", async () => {
        const rule = createMockRule({
          id: "rule-selector-exists-branch",
          name: "Selector exists branch",
          description:
            "Covers else-if (operator === 'exists' && elements.length > 0)",
          type: "selector",
          selector: ".forbidden-div",
          condition: { operator: "exists" },
          message: "Forbidden element found",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        const mockElement = {
          evaluate: vi
            .fn()
            .mockImplementation(
              async (cb: (el: { outerHTML: string }) => string) =>
                cb({ outerHTML: '<div class="forbidden-div">Bad</div>' })
            ),
        };

        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(violations[0].ruleId).toBe("rule-selector-exists-branch");
      });

      it("triggers selector exists branch when elements are present", async () => {
        const rule = createMockRule({
          id: "rule-selector-exists-branch",
          name: "Selector exists branch",
          description:
            "Covers else-if (operator === 'exists' && elements.length > 0)",
          type: "selector",
          selector: ".exists-branch",
          condition: { operator: "exists" },
          message: "Forbidden element found",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        const mockElement = {
          evaluate: vi
            .fn()
            .mockImplementation(
              async (cb: (el: { outerHTML: string }) => string) =>
                cb({ outerHTML: '<div class="exists-branch">Bad</div>' })
            ),
        };

        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(violations[0].ruleId).toBe("rule-selector-exists-branch");
      });

      it("takes selector else path when exists operator and no elements", async () => {
        const rule = createMockRule({
          id: "rule-selector-else-branch",
          name: "Selector else branch",
          description: "Covers else (no if/else-if match)",
          type: "selector",
          selector: ".else-branch",
          condition: { operator: "exists" },
          message: "Should not be triggered",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        mockPage.$$.mockResolvedValue([]); // elements.length === 0

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(0);
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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

      it("evaluates matches operator when attrValue and value are both present", async () => {
        const rule = createMockRule({
          id: "rule-attr-matches",
          name: "Attribute matches pattern",
          description: "Covers attrValue !== null && value branch",
          type: "attribute",
          selector: "[data-test]",
          condition: {
            attribute: "data-test",
            operator: "matches",
            value: "^foo", // valid, non-empty regex
          },
          message: "data-test starts with foo",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        const mockElement = {
          getAttribute: vi.fn().mockResolvedValue("foobar"),
          evaluate: vi
            .fn()
            .mockImplementation(
              async (cb: (el: { outerHTML: string }) => string) =>
                cb({ outerHTML: '<div data-test="foobar"></div>' })
            ),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(violations[0].ruleId).toBe("rule-attr-matches");
      });

      it("detects attribute existence with default 'exists' operator", async () => {
        const rule = createMockRule({
          id: "rule-attr-exists",
          name: "Attribute exists",
          description: "Covers case 'exists' in attribute switch",
          type: "attribute",
          selector: "button",
          condition: {
            attribute: "aria-label", // no operator provided → defaults to 'exists'
          } as CustomRule["condition"],
          message: "Button has aria-label",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        const mockElement = {
          getAttribute: vi.fn().mockResolvedValue("Submit"), // non-null → isViolation = true
          evaluate: vi
            .fn()
            .mockImplementation(
              async (cb: (el: { outerHTML: string }) => string) =>
                cb({ outerHTML: '<button aria-label="Submit">Submit</button>' })
            ),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(violations[0].ruleId).toBe("rule-attr-exists");
        expect(mockElement.getAttribute).toHaveBeenCalledWith("aria-label");
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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

      it("ignores invalid regex in content pattern without throwing", async () => {
        const rule = createMockRule({
          id: "rule-content-invalid-regex",
          name: "Invalid content regex",
          description: "Covers pattern invalid regex catch",
          type: "content",
          selector: "p",
          condition: {
            pattern: "[", // invalid regex
          },
          message: "Should not trigger",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        const mockElement = {
          textContent: vi.fn().mockResolvedValue("Some regular text"),
          evaluate: vi
            .fn()
            .mockImplementation(
              async (cb: (el: { outerHTML: string }) => string) =>
                cb({ outerHTML: "<p>Some regular text</p>" })
            ),
        };
        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(0);
        expect(mockElement.evaluate).toHaveBeenCalled();
      });
      it("uses empty string fallback when textContent is null (covers textContent || '')", async () => {
        const rule = createMockRule({
          id: "rule-content-empty-fallback",
          name: "Content fallback test",
          description: "Covers textContent null → ''",
          type: "content",
          selector: "p",
          condition: {
            minLength: 1,
          },
          message: "Content too short",
          severity: "minor",
        });

        mockGetEnabledRules.mockResolvedValue([rule]);

        const mockElement = {
          textContent: vi.fn().mockResolvedValue(null), // forces fallback ''
          evaluate: vi
            .fn()
            .mockImplementation(
              async (cb: (el: { outerHTML: string }) => string) =>
                cb({ outerHTML: "<p></p>" })
            ),
        };

        mockPage.$$.mockResolvedValue([mockElement]);

        const violations = await evaluateCustomRules({
          page: mockPage as unknown as Page,
        });

        expect(violations).toHaveLength(1);
        expect(violations[0].ruleId).toBe("rule-content-empty-fallback");
        expect(mockElement.textContent).toHaveBeenCalled();
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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

        mockGetEnabledRules.mockResolvedValue([rule]);

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

      mockGetEnabledRules.mockResolvedValue([rule]);

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

      mockGetEnabledRules.mockResolvedValue([rule]);
      mockPage.$$.mockRejectedValue(new Error("Page closed"));

      // Should not throw
      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toEqual([]);
    });
  });

  describe("getEnabledRulesCount", () => {
    it("returns 0 when no rules enabled", async () => {
      mockGetEnabledRules.mockResolvedValue([]);

      const count = await getEnabledRulesCount();

      expect(count).toBe(0);
    });

    it("returns correct count of enabled rules", async () => {
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

      mockGetEnabledRules.mockResolvedValue(rules);

      const count = await getEnabledRulesCount();

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

      mockGetEnabledRules.mockResolvedValue([rule]);

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

    it("ignores invalid regex in attribute matches operator without throwing", async () => {
      const rule = createMockRule({
        id: "rule-attr-invalid-regex",
        name: "Invalid attribute regex",
        type: "attribute",
        selector: "[data-test]",
        condition: {
          attribute: "data-test",
          operator: "matches",
          value: "[", // invalid regex
        },
        message: "Should never trigger due to invalid regex",
        severity: "minor",
      });

      mockGetEnabledRules.mockResolvedValue([rule]);

      const mockElement = {
        getAttribute: vi.fn().mockResolvedValue("abc"),
        evaluate: vi
          .fn()
          .mockImplementation(
            async (cb: (el: { outerHTML: string }) => string) =>
              cb({ outerHTML: '<div data-test="abc"></div>' })
          ),
      };
      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(0);
      expect(mockElement.evaluate).toHaveBeenCalled();
    });

    it("returns no violations when attribute is missing (covers if !attribute)", async () => {
      const rule = createMockRule({
        id: "rule-missing-attribute",
        name: "Missing attribute field",
        type: "attribute",
        selector: "img",
        condition: {
          // no "attribute" field → triggers: if (!attribute) return violations;
          operator: "exists",
        },
        message: "Should not run because attribute is missing",
        severity: "minor",
      });

      mockGetEnabledRules.mockResolvedValue([rule]);

      const mockElement = {
        getAttribute: vi.fn().mockResolvedValue("ignored"),
        evaluate: vi.fn().mockResolvedValue("<img>"),
      };
      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toEqual([]);
      expect(mockElement.getAttribute).not.toHaveBeenCalled();
    });

    it("does not evaluate matches when value is missing (covers else branch of matches)", async () => {
      const rule = createMockRule({
        id: "rule-attr-matches-no-value",
        name: "Matches without value",
        description: "Covers attrValue !== null && value false branch",
        type: "attribute",
        selector: "[data-test]",
        condition: {
          attribute: "data-test",
          operator: "matches",
          // value intentionally omitted → value === undefined
        } as CustomRule["condition"],
        message: "Should not trigger without value",
        severity: "minor",
      });

      mockGetEnabledRules.mockResolvedValue([rule]);

      const mockElement = {
        getAttribute: vi.fn().mockResolvedValue("foobar"),
        evaluate: vi
          .fn()
          .mockImplementation(
            async (cb: (el: { outerHTML: string }) => string) =>
              cb({ outerHTML: '<div data-test="foobar"></div>' })
          ),
      };
      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(0);
      expect(mockElement.getAttribute).toHaveBeenCalledWith("data-test");
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

      mockGetEnabledRules.mockResolvedValue([rule]);

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

    it("handles siblings check when parent element is missing", async () => {
      const rule = createMockRule({
        id: "rule-structure-parent-null",
        name: "Siblings with no parent",
        type: "structure",
        selector: "input",
        condition: {
          siblings: "label",
        },
        message: "Input missing label sibling when no parent",
        severity: "serious",
      });

      mockGetEnabledRules.mockResolvedValue([rule]);

      const mockElement = {
        evaluate: vi
          .fn()
          .mockImplementation(
            async (
              cb: (
                el: {
                  outerHTML: string;
                  parentElement: {
                    querySelector: (sel: string) => unknown;
                  } | null;
                },
                selectorArg?: string
              ) => unknown,
              selectorArg?: string
            ) => {
              if (cb.length === 1) {
                return cb({ outerHTML: "<input>", parentElement: null });
              }
              return cb(
                { outerHTML: "<input>", parentElement: null },
                selectorArg
              );
            }
          ),
      };

      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(1);
      expect(mockElement.evaluate).toHaveBeenCalled();
    });
    it("structure rule evaluates parent selector callback (covers el.closest)", async () => {
      const rule = createMockRule({
        id: "rule-parent-ok",
        name: "Parent exists",
        type: "structure",
        selector: "span",
        condition: { parent: "div" },
        message: "Parent missing",
        severity: "minor",
      });

      mockGetEnabledRules.mockResolvedValue([rule]);

      const mockElement = {
        evaluate: vi.fn().mockImplementation(async (cb, parentSelector) => {
          return cb(
            {
              outerHTML: "<span></span>",
              closest: (sel: string) => (sel === parentSelector ? {} : null),
            },
            parentSelector
          );
        }),
      };

      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(0);
      expect(mockElement.evaluate).toHaveBeenCalled();
    });

    it("structure rule evaluates children selector callback (covers el.querySelector)", async () => {
      const rule = createMockRule({
        id: "rule-children-ok",
        name: "Children exist",
        type: "structure",
        selector: "div",
        condition: { children: "span" },
        message: "Missing span",
        severity: "minor",
      });

      mockGetEnabledRules.mockResolvedValue([rule]);

      const mockElement = {
        evaluate: vi.fn().mockImplementation(async (cb, childSelector) => {
          return cb(
            {
              outerHTML: "<div><span></span></div>",
              querySelector: (sel: string) =>
                sel === childSelector ? {} : null,
            },
            childSelector
          );
        }),
      };

      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(0);
      expect(mockElement.evaluate).toHaveBeenCalled();
    });

    it("structure rule covers siblings callback parent null branch (if !parent return false)", async () => {
      const rule = createMockRule({
        id: "rule-siblings-no-parent",
        name: "Sibling check with no parent",
        type: "structure",
        selector: "input",
        condition: { siblings: "label" },
        message: "Missing sibling",
        severity: "serious",
      });

      mockGetEnabledRules.mockResolvedValue([rule]);

      const mockElement = {
        evaluate: vi.fn().mockImplementation(async (cb, siblingSelector) => {
          return cb(
            {
              outerHTML: "<input>",
              parentElement: null, // triggers: if (!parent) return false
            },
            siblingSelector
          );
        }),
      };

      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(1);
    });

    it("structure rule evaluates sibling selector callback (covers parent.querySelector)", async () => {
      const rule = createMockRule({
        id: "rule-siblings-ok",
        name: "Sibling exists",
        type: "structure",
        selector: "input",
        condition: { siblings: "label" },
        message: "Missing label",
        severity: "serious",
      });

      mockGetEnabledRules.mockResolvedValue([rule]);

      const mockElement = {
        evaluate: vi.fn().mockImplementation(async (cb, siblingSelector) => {
          return cb(
            {
              outerHTML: "<input>",
              parentElement: {
                querySelector: (sel: string) =>
                  sel === siblingSelector ? {} : null,
              },
            },
            siblingSelector
          );
        }),
      };

      mockPage.$$.mockResolvedValue([mockElement]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toHaveLength(0);
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

      mockGetEnabledRules.mockResolvedValue([rule]);

      const violations = await evaluateCustomRules({
        page: mockPage as unknown as Page,
      });

      expect(violations).toEqual([]);
    });
  });
});
