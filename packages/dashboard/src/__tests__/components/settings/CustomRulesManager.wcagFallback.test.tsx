import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CustomRule, RuleCondition } from "../../../types/rules";

const mockConfirm = vi.fn().mockResolvedValue(true);
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockWarning = vi.fn();

const makeRule = (overrides: Partial<CustomRule> = {}): CustomRule => ({
  id: "r1",
  name: "Skip link",
  description: "desc",
  selector: "a.skip",
  severity: "serious",
  type: "selector",
  condition: { operator: "exists" } as RuleCondition,
  message: "msg",
  helpUrl: "",
  wcagTags: ["wcag21aa"],
  enabled: true,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  ...overrides,
});

const createHookReturn = () => ({
  rules: [makeRule()],
  loading: false,
  error: null as string | null,
  totalRules: 1,
  enabledRules: 1,
  createRule: vi.fn().mockResolvedValue(makeRule({ id: "new" })),
  updateRule: vi.fn().mockResolvedValue(makeRule()),
  deleteRule: vi.fn().mockResolvedValue(true),
  toggleRule: vi.fn(),
  testRule: vi.fn().mockResolvedValue({ passed: false, violations: [{ selector: "a", message: "bad" }] }),
  importRules: vi.fn().mockResolvedValue({ imported: 1 }),
  exportRules: vi.fn().mockResolvedValue({ rules: [makeRule()] }),
});

// Mock useRuleForm to return undefined wcagTags
vi.mock("../../../hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useCustomRules: () => createHookReturn(),
    useRuleForm: () => ({
      formData: {
        name: "",
        description: "",
        type: "selector" as const,
        severity: "serious" as const,
        selector: "",
        condition: { operator: "not-exists" as const },
        message: "",
        helpUrl: "",
        wcagTags: undefined, // This triggers the ?? false branch
        enabled: true,
      },
      editingRule: null,
      testHtml: "",
      testResults: null,
      setFormData: vi.fn(),
      setTestHtml: vi.fn(),
      setTestResults: vi.fn(),
      resetForm: vi.fn(),
      loadRuleForEdit: vi.fn(),
      updateField: vi.fn(),
      updateType: vi.fn(),
      updateSeverity: vi.fn(),
      updateCondition: vi.fn(),
      toggleWcagTag: vi.fn(),
    }),
    useConfirmDialog: () => ({
      isOpen: false,
      options: { title: "", message: "", confirmLabel: "", cancelLabel: "" },
      confirm: mockConfirm,
      handleConfirm: vi.fn(),
      handleCancel: vi.fn(),
    }),
    useToast: () => ({
      toasts: [],
      success: mockSuccess,
      error: mockError,
      warning: mockWarning,
      closeToast: vi.fn(),
    }),
  };
});

// Import after mocking
import { CustomRulesManager } from "../../../components/settings/CustomRulesManager";

describe("settings/CustomRulesManager wcagTags fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders WCAG tag buttons as unselected when wcagTags is undefined (covers ?? false branch)", () => {
    render(<CustomRulesManager />);
    fireEvent.click(screen.getAllByRole("button", { name: "➕ New Rule" })[0]);

    // All WCAG tag buttons should render as unselected (isSelected=false due to ?? false fallback)
    const wcagButtons = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.startsWith("wcag")
    );
    expect(wcagButtons.length).toBeGreaterThan(0);

    // Each button should have the unselected style (borderColor: #e2e8f0 not #3b82f6)
    wcagButtons.forEach((btn) => {
      expect(btn).toHaveStyle({ borderColor: "#e2e8f0" });
    });
  });
});
