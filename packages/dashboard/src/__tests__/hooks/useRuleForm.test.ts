import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRuleForm } from "../../hooks/useRuleForm";
import type { CustomRule } from "../../types/rules";

vi.mock("../../utils/wcag", () => ({
  resolveWcagTags: (tags?: string[] | null) => tags ?? [],
}));

describe("hooks/useRuleForm", () => {
  const mockCustomRule: CustomRule = {
    id: "rule-123",
    name: "Test Rule",
    description: "A test rule description",
    type: "attribute",
    severity: "critical",
    selector: "img[alt]",
    condition: { operator: "exists", attribute: "alt" },
    message: "Image must have alt attribute",
    helpUrl: "https://example.com/help",
    wcagTags: ["wcag2a", "wcag111"],
    enabled: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  };

  it("returns initial form state", () => {
    const { result } = renderHook(() => useRuleForm());

    expect(result.current.formData).toEqual({
      name: "",
      description: "",
      type: "selector",
      severity: "serious",
      selector: "",
      condition: { operator: "not-exists" },
      message: "",
      helpUrl: "",
      wcagTags: [],
      enabled: true,
    });
    expect(result.current.editingRule).toBeNull();
    expect(result.current.testHtml).toBe("");
    expect(result.current.testResults).toBeNull();
  });

  it("updates testHtml with setTestHtml", () => {
    const { result } = renderHook(() => useRuleForm());

    act(() => {
      result.current.setTestHtml("<div>Test HTML</div>");
    });

    expect(result.current.testHtml).toBe("<div>Test HTML</div>");
  });

  it("updates testResults with setTestResults", () => {
    const { result } = renderHook(() => useRuleForm());
    const testResults = {
      passed: false,
      violations: [{ selector: "img", message: "Missing alt" }],
    };

    act(() => {
      result.current.setTestResults(testResults);
    });

    expect(result.current.testResults).toEqual(testResults);

    act(() => {
      result.current.setTestResults(null);
    });

    expect(result.current.testResults).toBeNull();
  });

  it("resets form to initial state with resetForm", () => {
    const { result } = renderHook(() => useRuleForm());

    act(() => {
      result.current.loadRuleForEdit(mockCustomRule);
      result.current.setTestHtml("<div>Test</div>");
      result.current.setTestResults({ passed: true, violations: [] });
    });

    expect(result.current.formData.name).toBe("Test Rule");
    expect(result.current.editingRule).not.toBeNull();
    expect(result.current.testHtml).toBe("<div>Test</div>");
    expect(result.current.testResults).not.toBeNull();

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual({
      name: "",
      description: "",
      type: "selector",
      severity: "serious",
      selector: "",
      condition: { operator: "not-exists" },
      message: "",
      helpUrl: "",
      wcagTags: [],
      enabled: true,
    });
    expect(result.current.editingRule).toBeNull();
    expect(result.current.testResults).toBeNull();
    expect(result.current.testHtml).toBe("");
  });

  it("loads rule for editing with loadRuleForEdit", () => {
    const { result } = renderHook(() => useRuleForm());

    act(() => {
      result.current.loadRuleForEdit(mockCustomRule);
    });

    expect(result.current.formData).toEqual({
      name: mockCustomRule.name,
      description: mockCustomRule.description,
      type: mockCustomRule.type,
      severity: mockCustomRule.severity,
      selector: mockCustomRule.selector,
      condition: mockCustomRule.condition,
      message: mockCustomRule.message,
      helpUrl: mockCustomRule.helpUrl,
      wcagTags: mockCustomRule.wcagTags,
      enabled: mockCustomRule.enabled,
    });
    expect(result.current.editingRule).toEqual(mockCustomRule);
  });

  it("updates a single field with updateField", () => {
    const { result } = renderHook(() => useRuleForm());

    act(() => {
      result.current.updateField("name", "New Rule Name");
    });
    expect(result.current.formData.name).toBe("New Rule Name");

    act(() => {
      result.current.updateField("description", "New description");
    });
    expect(result.current.formData.description).toBe("New description");

    act(() => {
      result.current.updateField("selector", "button.primary");
    });
    expect(result.current.formData.selector).toBe("button.primary");

    act(() => {
      result.current.updateField("message", "Button needs label");
    });
    expect(result.current.formData.message).toBe("Button needs label");

    act(() => {
      result.current.updateField("helpUrl", "https://help.example.com");
    });
    expect(result.current.formData.helpUrl).toBe("https://help.example.com");

    act(() => {
      result.current.updateField("enabled", false);
    });
    expect(result.current.formData.enabled).toBe(false);

    act(() => {
      result.current.updateField("wcagTags", ["wcag21aa"]);
    });
    expect(result.current.formData.wcagTags).toEqual(["wcag21aa"]);
  });

  it("updates type with updateType", () => {
    const { result } = renderHook(() => useRuleForm());

    expect(result.current.formData.type).toBe("selector");

    act(() => {
      result.current.updateType("attribute");
    });
    expect(result.current.formData.type).toBe("attribute");

    act(() => {
      result.current.updateType("content");
    });
    expect(result.current.formData.type).toBe("content");

    act(() => {
      result.current.updateType("structure");
    });
    expect(result.current.formData.type).toBe("structure");
  });

  it("updates severity with updateSeverity", () => {
    const { result } = renderHook(() => useRuleForm());

    expect(result.current.formData.severity).toBe("serious");

    act(() => {
      result.current.updateSeverity("critical");
    });
    expect(result.current.formData.severity).toBe("critical");

    act(() => {
      result.current.updateSeverity("moderate");
    });
    expect(result.current.formData.severity).toBe("moderate");

    act(() => {
      result.current.updateSeverity("minor");
    });
    expect(result.current.formData.severity).toBe("minor");
  });

  it("updates condition with updateCondition", () => {
    const { result } = renderHook(() => useRuleForm());

    expect(result.current.formData.condition).toEqual({ operator: "not-exists" });

    act(() => {
      result.current.updateCondition({ operator: "exists" });
    });
    expect(result.current.formData.condition).toEqual({ operator: "exists" });

    act(() => {
      result.current.updateCondition({ attribute: "aria-label" });
    });
    expect(result.current.formData.condition).toEqual({
      operator: "exists",
      attribute: "aria-label",
    });

    act(() => {
      result.current.updateCondition({ value: "submit" });
    });
    expect(result.current.formData.condition).toEqual({
      operator: "exists",
      attribute: "aria-label",
      value: "submit",
    });

    act(() => {
      result.current.updateCondition({ operator: "equals", minLength: 5 });
    });
    expect(result.current.formData.condition).toEqual({
      operator: "equals",
      attribute: "aria-label",
      value: "submit",
      minLength: 5,
    });
  });

  it("adds a tag with toggleWcagTag when tag is not present", () => {
    const { result } = renderHook(() => useRuleForm());

    expect(result.current.formData.wcagTags).toEqual([]);

    act(() => {
      result.current.toggleWcagTag("wcag2a");
    });
    expect(result.current.formData.wcagTags).toEqual(["wcag2a"]);

    act(() => {
      result.current.toggleWcagTag("wcag111");
    });
    expect(result.current.formData.wcagTags).toEqual(["wcag2a", "wcag111"]);
  });

  it("removes a tag with toggleWcagTag when tag is already present", () => {
    const { result } = renderHook(() => useRuleForm());

    act(() => {
      result.current.toggleWcagTag("wcag2a");
      result.current.toggleWcagTag("wcag111");
      result.current.toggleWcagTag("wcag21aa");
    });
    expect(result.current.formData.wcagTags).toEqual(["wcag2a", "wcag111", "wcag21aa"]);

    act(() => {
      result.current.toggleWcagTag("wcag111");
    });
    expect(result.current.formData.wcagTags).toEqual(["wcag2a", "wcag21aa"]);

    act(() => {
      result.current.toggleWcagTag("wcag2a");
    });
    expect(result.current.formData.wcagTags).toEqual(["wcag21aa"]);

    act(() => {
      result.current.toggleWcagTag("wcag21aa");
    });
    expect(result.current.formData.wcagTags).toEqual([]);
  });

  it("allows direct setFormData updates", () => {
    const { result } = renderHook(() => useRuleForm());

    act(() => {
      result.current.setFormData({
        name: "Direct Update Rule",
        description: "Set via setFormData",
        type: "content",
        severity: "minor",
        selector: "p.error",
        condition: { operator: "contains", value: "error" },
        message: "Contains error text",
        helpUrl: "https://direct.example.com",
        wcagTags: ["wcag244"],
        enabled: false,
      });
    });

    expect(result.current.formData).toEqual({
      name: "Direct Update Rule",
      description: "Set via setFormData",
      type: "content",
      severity: "minor",
      selector: "p.error",
      condition: { operator: "contains", value: "error" },
      message: "Contains error text",
      helpUrl: "https://direct.example.com",
      wcagTags: ["wcag244"],
      enabled: false,
    });
  });

  it("supports setFormData with updater function", () => {
    const { result } = renderHook(() => useRuleForm());

    act(() => {
      result.current.updateField("name", "Original Name");
    });

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        name: prev.name + " - Updated",
        description: "Added via updater",
      }));
    });

    expect(result.current.formData.name).toBe("Original Name - Updated");
    expect(result.current.formData.description).toBe("Added via updater");
  });

  it("maintains state independence across hook instances", () => {
    const { result: result1 } = renderHook(() => useRuleForm());
    const { result: result2 } = renderHook(() => useRuleForm());

    act(() => {
      result1.current.updateField("name", "Rule 1");
    });

    act(() => {
      result2.current.updateField("name", "Rule 2");
    });

    expect(result1.current.formData.name).toBe("Rule 1");
    expect(result2.current.formData.name).toBe("Rule 2");
  });

  it("preserves other form fields when updating condition", () => {
    const { result } = renderHook(() => useRuleForm());

    act(() => {
      result.current.updateField("name", "My Rule");
      result.current.updateField("selector", "div.test");
      result.current.updateType("attribute");
      result.current.updateSeverity("critical");
    });

    act(() => {
      result.current.updateCondition({ operator: "equals", value: "test" });
    });

    expect(result.current.formData.name).toBe("My Rule");
    expect(result.current.formData.selector).toBe("div.test");
    expect(result.current.formData.type).toBe("attribute");
    expect(result.current.formData.severity).toBe("critical");
    expect(result.current.formData.condition).toEqual({
      operator: "equals",
      value: "test",
    });
  });
});
