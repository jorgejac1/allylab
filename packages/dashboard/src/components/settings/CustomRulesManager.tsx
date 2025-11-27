import { useState, useRef } from "react";
import { Card, Button, Input, Select, ConfirmDialog, Toast } from "../ui";
import { useCustomRules, useConfirmDialog, useToast } from "../../hooks";
import type {
  CustomRule,
  CreateRuleRequest,
  RuleType,
  RuleSeverity,
  RuleCondition,
} from "../../types/rules";

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: "selector", label: "Selector (CSS)" },
  { value: "attribute", label: "Attribute Check" },
  { value: "content", label: "Content Check" },
  { value: "structure", label: "Structure Check" },
];

const SEVERITIES: { value: RuleSeverity; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "#dc2626" },
  { value: "serious", label: "Serious", color: "#ea580c" },
  { value: "moderate", label: "Moderate", color: "#ca8a04" },
  { value: "minor", label: "Minor", color: "#2563eb" },
];

const OPERATORS = [
  { value: "exists", label: "Exists" },
  { value: "not-exists", label: "Does Not Exist" },
  { value: "equals", label: "Equals" },
  { value: "not-equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "matches", label: "Matches (Regex)" },
];

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag2aaa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
  "experimental",
];

export function CustomRulesManager() {
  const {
    rules,
    loading,
    error,
    totalRules,
    enabledRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    importRules,
    exportRules,
  } = useCustomRules();

  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();
  const { toasts, success, error: showError, warning, closeToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [testHtml, setTestHtml] = useState("");
  const [testResults, setTestResults] = useState<{
    passed: boolean;
    violations: Array<{ selector: string; message: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<CreateRuleRequest>({
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

  const resetForm = () => {
    setFormData({
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
    setEditingRule(null);
    setTestResults(null);
    setTestHtml("");
  };

  const handleEdit = (rule: CustomRule) => {
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      severity: rule.severity,
      selector: rule.selector,
      condition: rule.condition,
      message: rule.message,
      helpUrl: rule.helpUrl,
      wcagTags: rule.wcagTags,
      enabled: rule.enabled,
    });
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.selector) {
      warning("Name and selector are required");
      return;
    }

    if (editingRule) {
      const result = await updateRule(editingRule.id, formData);
      if (result) {
        success(`Rule "${formData.name}" updated successfully`);
      } else {
        showError("Failed to update rule");
      }
    } else {
      const result = await createRule(formData);
      if (result) {
        success(`Rule "${formData.name}" created successfully`);
      } else {
        showError("Failed to create rule");
      }
    }

    resetForm();
    setShowForm(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: "Delete Rule",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });

    if (confirmed) {
      const result = await deleteRule(id);
      if (result) {
        success(`Rule "${name}" deleted successfully`);
      } else {
        showError("Failed to delete rule");
      }
    }
  };

  const handleTest = async () => {
    if (!testHtml.trim()) {
      warning("Please enter HTML to test");
      return;
    }

    const results = await testRule(formData, testHtml);
    if (results) {
      setTestResults(results);
      if (results.passed) {
        success("Rule test passed!");
      } else {
        warning(`Found ${results.violations.length} violation(s)`);
      }
    }
  };

  const handleExport = async () => {
    const data = await exportRules();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `allylab-rules-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success(`Exported ${data.rules.length} rules`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const rulesToImport = data.rules || data;

      if (Array.isArray(rulesToImport)) {
        const confirmed = await confirm({
          title: "Import Rules",
          message: `Import ${rulesToImport.length} rule(s)? This will add them to your existing rules.`,
          confirmLabel: "Import",
          cancelLabel: "Cancel",
          variant: "info",
        });

        if (confirmed) {
          const result = await importRules(rulesToImport);
          if (result) {
            success(`Successfully imported ${result.imported} rules`);
          } else {
            showError("Failed to import rules");
          }
        }
      } else {
        showError("Invalid file format. Please upload a valid JSON file.");
      }
    } catch {
      showError("Failed to parse file. Please ensure it is valid JSON.");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleWcagTagToggle = (tag: string) => {
    const tags = formData.wcagTags || [];
    if (tags.includes(tag)) {
      setFormData({ ...formData, wcagTags: tags.filter((t) => t !== tag) });
    } else {
      setFormData({ ...formData, wcagTags: [...tags, tag] });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Toast Container */}
      <Toast toasts={toasts} onClose={closeToast} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        variant={options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Header */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>
              📏 Custom Accessibility Rules
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
              Create custom rules to extend built-in accessibility checks •{" "}
              {enabledRules}/{totalRules} enabled
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: "none" }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              📥 Import
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={rules.length === 0}
            >
              📤 Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              ➕ New Rule
            </Button>
          </div>
        </div>
      </Card>

      {/* Error message */}
      {error && (
        <Card style={{ borderColor: "#fecaca", background: "#fef2f2" }}>
          <p style={{ color: "#dc2626", margin: 0 }}>⚠️ {error}</p>
        </Card>
      )}

      {/* Rule Form */}
      {showForm && (
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
            {editingRule ? "✏️ Edit Rule" : "➕ Create New Rule"}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Row 1: Name & Type */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Rule Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Skip Navigation Link"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Type *
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as RuleType,
                    })
                  }
                  options={RULE_TYPES}
                />
              </div>
            </div>

            {/* Row 2: Description */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Explain what this rule checks for"
              />
            </div>

            {/* Row 3: Selector & Severity */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  CSS Selector *
                </label>
                <Input
                  value={formData.selector}
                  onChange={(e) =>
                    setFormData({ ...formData, selector: e.target.value })
                  }
                  placeholder="e.g., body > a[href^='#']:first-child"
                  style={{ fontFamily: "monospace" }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Severity *
                </label>
                <Select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severity: e.target.value as RuleSeverity,
                    })
                  }
                  options={SEVERITIES}
                />
              </div>
            </div>

            {/* Row 4: Condition */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Operator
                </label>
                <Select
                  value={formData.condition?.operator || "not-exists"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition: {
                        ...formData.condition,
                        operator: e.target.value as RuleCondition["operator"],
                      },
                    })
                  }
                  options={OPERATORS}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Attribute (optional)
                </label>
                <Input
                  value={formData.condition?.attribute || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition: {
                        ...formData.condition,
                        attribute: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., aria-label"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Value (optional)
                </label>
                <Input
                  value={formData.condition?.value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition: {
                        ...formData.condition,
                        value: e.target.value,
                      },
                    })
                  }
                  placeholder="Expected value"
                />
              </div>
            </div>

            {/* Row 5: Message & Help URL */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Error Message
                </label>
                <Input
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Message shown when rule fails"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Help URL
                </label>
                <Input
                  value={formData.helpUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, helpUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Row 6: WCAG Tags */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                WCAG Tags
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {WCAG_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleWcagTagToggle(tag)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: formData.wcagTags?.includes(tag)
                        ? "#3b82f6"
                        : "#e2e8f0",
                      background: formData.wcagTags?.includes(tag)
                        ? "#eff6ff"
                        : "#fff",
                      color: formData.wcagTags?.includes(tag)
                        ? "#3b82f6"
                        : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Section */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                🧪 Test Rule (optional)
              </label>
              <textarea
                value={testHtml}
                onChange={(e) => setTestHtml(e.target.value)}
                placeholder="Paste HTML to test the rule against..."
                style={{
                  width: "100%",
                  height: 100,
                  padding: 12,
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontFamily: "monospace",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <Button variant="secondary" size="sm" onClick={handleTest}>
                  ▶️ Run Test
                </Button>
                {testResults && (
                  <span
                    style={{
                      fontSize: 14,
                      color: testResults.passed ? "#10b981" : "#dc2626",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {testResults.passed
                      ? "✅ Passed"
                      : `❌ ${testResults.violations.length} violation(s) found`}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                borderTop: "1px solid #e2e8f0",
                paddingTop: 16,
              }}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading
                  ? "Saving..."
                  : editingRule
                  ? "Update Rule"
                  : "Create Rule"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Rules List */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
          📋 Rules ({rules.length})
        </h3>

        {loading && rules.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>
            Loading rules...
          </p>
        ) : rules.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: 24 }}>
            No custom rules yet. Create one to get started!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rules.map((rule) => (
              <RuleItem
                key={rule.id}
                rule={rule}
                onEdit={() => handleEdit(rule)}
                onDelete={() => handleDelete(rule.id, rule.name)}
                onToggle={() => toggleRule(rule.id)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RuleItem({
  rule,
  onEdit,
  onDelete,
  onToggle,
}: {
  rule: CustomRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const severityColors: Record<RuleSeverity, string> = {
    critical: "#dc2626",
    serious: "#ea580c",
    moderate: "#ca8a04",
    minor: "#2563eb",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        background: rule.enabled ? "#f8fafc" : "#f1f5f9",
        borderRadius: 8,
        opacity: rule.enabled ? 1 : 0.7,
      }}
    >
      {/* Toggle */}
      <label style={{ cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={onToggle}
          style={{ width: 18, height: 18 }}
        />
      </label>

      {/* Severity badge */}
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          background: `${severityColors[rule.severity]}15`,
          color: severityColors[rule.severity],
          textTransform: "uppercase",
        }}
      >
        {rule.severity}
      </span>

      {/* Rule info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{rule.name}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          <code
            style={{
              background: "#e2e8f0",
              padding: "1px 4px",
              borderRadius: 2,
            }}
          >
            {rule.selector.length > 40
              ? `${rule.selector.slice(0, 40)}...`
              : rule.selector}
          </code>
          {rule.wcagTags.length > 0 && (
            <span style={{ marginLeft: 8 }}>
              {rule.wcagTags.slice(0, 2).join(", ")}
              {rule.wcagTags.length > 2 && ` +${rule.wcagTags.length - 2}`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={onEdit}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            borderRadius: 4,
            color: "#64748b",
          }}
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            borderRadius: 4,
            color: "#dc2626",
          }}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}