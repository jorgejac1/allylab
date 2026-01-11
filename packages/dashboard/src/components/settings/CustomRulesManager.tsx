import { useRef, useState } from 'react';
import { Card, Button, Input, Select, ConfirmDialog, Toast } from '../ui';
import { useCustomRules, useConfirmDialog, useToast, useRuleForm } from '../../hooks';
import type { CustomRule, CreateRuleRequest, RuleType, RuleSeverity, RuleCondition } from '../../types/rules';

// ============================================
// Constants
// ============================================

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'selector', label: 'Selector (CSS)' },
  { value: 'attribute', label: 'Attribute Check' },
  { value: 'content', label: 'Content Check' },
  { value: 'structure', label: 'Structure Check' },
];

const SEVERITIES: { value: RuleSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'serious', label: 'Serious', color: '#ea580c' },
  { value: 'moderate', label: 'Moderate', color: '#ca8a04' },
  { value: 'minor', label: 'Minor', color: '#2563eb' },
];

const OPERATORS: { value: string; label: string }[] = [
  { value: 'exists', label: 'Exists' },
  { value: 'not-exists', label: 'Does Not Exist' },
  { value: 'equals', label: 'Equals' },
  { value: 'not-equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'matches', label: 'Matches (Regex)' },
];

const WCAG_TAGS = [
  'wcag2a', 'wcag2aa', 'wcag2aaa',
  'wcag21a', 'wcag21aa', 'wcag22aa',
  'best-practice', 'experimental',
];

// ============================================
// Main Component
// ============================================

export function CustomRulesManager() {
  const {
    rules, loading, error, totalRules, enabledRules,
    createRule, updateRule, deleteRule, toggleRule, testRule,
    importRules, exportRules,
  } = useCustomRules();

  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();
  const { toasts, success, error: showError, warning, closeToast } = useToast();
  const {
    formData, editingRule, testHtml, testResults,
    setTestHtml, setTestResults, resetForm, loadRuleForEdit,
    updateField, updateCondition, toggleWcagTag,
  } = useRuleForm();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);

  // ---- Handlers ----

  const handleOpenForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (rule: CustomRule) => {
    loadRuleForEdit(rule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.selector.trim()) {
      warning('Name and selector are required');
      return;
    }

    const trimmedData = { 
      ...formData, 
      name: formData.name.trim(), 
      selector: formData.selector.trim() 
    };

    if (editingRule) {
      const result = await updateRule(editingRule.id, trimmedData);
      if (result) {
        success(`Rule "${trimmedData.name}" updated`);
      } else {
        showError('Failed to update rule');
      }
    } else {
      const result = await createRule(trimmedData);
      if (result) {
        success(`Rule "${trimmedData.name}" created`);
      } else {
        showError('Failed to create rule');
      }
    }

    resetForm();
    setShowForm(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Rule',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      const result = await deleteRule(id);
      if (result) {
        success(`Rule "${name}" deleted`);
      } else {
        showError('Failed to delete rule');
      }
    }
  };

  const handleTest = async () => {
    if (!testHtml.trim()) {
      warning('Please enter HTML to test');
      return;
    }

    const results = await testRule(formData, testHtml);
    if (results) {
      setTestResults(results);
      if (results.passed) {
        success('Rule test passed!');
      } else {
        warning(`Found ${results.violations.length} violation(s)`);
      }
    }
  };

  const handleExport = async () => {
    const data = await exportRules();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `allylab-rules-${new Date().toISOString().split('T')[0]}.json`;
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
          title: 'Import Rules',
          message: `Import ${rulesToImport.length} rule(s)? This will add them to your existing rules.`,
          confirmLabel: 'Import',
          cancelLabel: 'Cancel',
          variant: 'info',
        });

        if (confirmed) {
          const result = await importRules(rulesToImport);
          if (result) {
            success(`Imported ${result.imported} rules`);
          } else {
            showError('Failed to import rules');
          }
        }
      } else {
        showError('Invalid file format');
      }
    } catch {
      showError('Failed to parse file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---- Render ----

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Toast toasts={toasts} onClose={closeToast} />
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
      <RulesHeader
        enabledRules={enabledRules}
        totalRules={totalRules}
        rulesCount={rules.length}
        fileInputRef={fileInputRef}
        onImport={handleImport}
        onExport={handleExport}
        onNewRule={handleOpenForm}
      />

      {/* Error */}
      {error && (
        <Card style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <p style={{ color: '#dc2626', margin: 0 }}>⚠️ {error}</p>
        </Card>
      )}

      {/* Form */}
      {showForm && (
        <RuleForm
          formData={formData}
          editingRule={editingRule}
          testHtml={testHtml}
          testResults={testResults}
          loading={loading}
          onUpdateField={updateField}
          onUpdateCondition={updateCondition}
          onToggleWcagTag={toggleWcagTag}
          onTestHtmlChange={setTestHtml}
          onTest={handleTest}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
        />
      )}

      {/* Rules List */}
      <RulesList
        rules={rules}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggle={toggleRule}
      />
    </div>
  );
}

// ============================================
// Header Component
// ============================================

interface RulesHeaderProps {
  enabledRules: number;
  totalRules: number;
  rulesCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onNewRule: () => void;
}

function RulesHeader({
  enabledRules, totalRules, rulesCount, fileInputRef,
  onImport, onExport, onNewRule,
}: RulesHeaderProps) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>
            📏 Custom Accessibility Rules
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Create custom rules to extend built-in accessibility checks • {enabledRules}/{totalRules} enabled
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImport}
            style={{ display: 'none' }}
          />
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            📥 Import
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport} disabled={rulesCount === 0}>
            📤 Export
          </Button>
          <Button size="sm" onClick={onNewRule}>
            ➕ New Rule
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Form Component
// ============================================

interface RuleFormProps {
  formData: CreateRuleRequest;
  editingRule: CustomRule | null;
  testHtml: string;
  testResults: { passed: boolean; violations: Array<{ selector: string; message: string }> } | null;
  loading: boolean;
  onUpdateField: <K extends keyof CreateRuleRequest>(field: K, value: CreateRuleRequest[K]) => void;
  onUpdateCondition: (updates: Partial<RuleCondition>) => void;
  onToggleWcagTag: (tag: string) => void;
  onTestHtmlChange: (html: string) => void;
  onTest: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function RuleForm({
  formData, editingRule, testHtml, testResults, loading,
  onUpdateField, onUpdateCondition, onToggleWcagTag,
  onTestHtmlChange, onTest, onSubmit, onCancel,
}: RuleFormProps) {
  return (
    <Card>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
        {editingRule ? '✏️ Edit Rule' : '➕ Create New Rule'}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Row 1: Name & Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <FormField label="Rule Name *">
            <Input
              value={formData.name}
              onChange={e => onUpdateField('name', e.target.value)}
              placeholder="e.g., Skip Navigation Link"
            />
          </FormField>
          <FormField label="Type *">
            <Select
              value={formData.type}
              onChange={e => onUpdateField('type', e.target.value as RuleType)}
              options={RULE_TYPES}
            />
          </FormField>
        </div>

        {/* Row 2: Description */}
        <FormField label="Description">
          <Input
            value={formData.description}
            onChange={e => onUpdateField('description', e.target.value)}
            placeholder="Explain what this rule checks for"
          />
        </FormField>

        {/* Row 3: Selector & Severity */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <FormField label="CSS Selector *">
            <Input
              value={formData.selector}
              onChange={e => onUpdateField('selector', e.target.value)}
              placeholder="e.g., body > a[href^='#']:first-child"
              style={{ fontFamily: 'monospace' }}
            />
          </FormField>
          <FormField label="Severity *">
            <Select
              value={formData.severity}
              onChange={e => onUpdateField('severity', e.target.value as RuleSeverity)}
              options={SEVERITIES}
            />
          </FormField>
        </div>

        {/* Row 4: Condition */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <FormField label="Operator">
            <Select
              value={formData.condition?.operator || 'not-exists'}
              onChange={e => onUpdateCondition({ operator: e.target.value as RuleCondition['operator'] })}
              options={OPERATORS}
            />
          </FormField>
          <FormField label="Attribute (optional)">
            <Input
              value={formData.condition?.attribute || ''}
              onChange={e => onUpdateCondition({ attribute: e.target.value })}
              placeholder="e.g., aria-label"
            />
          </FormField>
          <FormField label="Value (optional)">
            <Input
              value={formData.condition?.value || ''}
              onChange={e => onUpdateCondition({ value: e.target.value })}
              placeholder="Expected value"
            />
          </FormField>
        </div>

        {/* Row 5: Message & Help URL */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <FormField label="Error Message">
            <Input
              value={formData.message}
              onChange={e => onUpdateField('message', e.target.value)}
              placeholder="Message shown when rule fails"
            />
          </FormField>
          <FormField label="Help URL">
            <Input
              value={formData.helpUrl || ''}
              onChange={e => onUpdateField('helpUrl', e.target.value)}
              placeholder="https://..."
            />
          </FormField>
        </div>

        {/* Row 6: WCAG Tags */}
        <FormField label="WCAG Tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {WCAG_TAGS.map(tag => (
              <WcagTagButton
                key={tag}
                tag={tag}
                isSelected={formData.wcagTags?.includes(tag) ?? false}
                onClick={() => onToggleWcagTag(tag)}
              />
            ))}
          </div>
        </FormField>

        {/* Test Section */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <FormField label="🧪 Test Rule (optional)">
            <textarea
              value={testHtml}
              onChange={e => onTestHtmlChange(e.target.value)}
              placeholder="Paste HTML to test the rule against..."
              style={{
                width: '100%',
                height: 100,
                padding: 12,
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                fontFamily: 'monospace',
                fontSize: 13,
                resize: 'vertical',
              }}
            />
          </FormField>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Button variant="secondary" size="sm" onClick={onTest}>
              ▶️ Run Test
            </Button>
            {testResults && (
              <span style={{
                fontSize: 14,
                color: testResults.passed ? '#10b981' : '#dc2626',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
              }}>
                {testResults.passed
                  ? '✅ Passed'
                  : `❌ ${testResults.violations.length} violation(s) found`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          borderTop: '1px solid #e2e8f0',
          paddingTop: 16,
        }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Rules List Component
// ============================================

interface RulesListProps {
  rules: CustomRule[];
  loading: boolean;
  onEdit: (rule: CustomRule) => void;
  onDelete: (id: string, name: string) => void;
  onToggle: (id: string) => void;
}

function RulesList({ rules, loading, onEdit, onDelete, onToggle }: RulesListProps) {
  return (
    <Card>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
        📋 Rules ({rules.length})
      </h3>

      {loading && rules.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>Loading rules...</p>
      ) : rules.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>
          No custom rules yet. Create one to get started!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.map(rule => (
            <RuleItem
              key={rule.id}
              rule={rule}
              onEdit={() => onEdit(rule)}
              onDelete={() => onDelete(rule.id, rule.name)}
              onToggle={() => onToggle(rule.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================
// Rule Item Component
// ============================================

interface RuleItemProps {
  rule: CustomRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function RuleItem({ rule, onEdit, onDelete, onToggle }: RuleItemProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: rule.enabled ? '#f8fafc' : '#f1f5f9',
      borderRadius: 8,
      opacity: rule.enabled ? 1 : 0.7,
    }}>
      <label style={{ cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={onToggle}
          style={{ width: 18, height: 18 }}
        />
      </label>

      <SeverityBadge severity={rule.severity} />

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{rule.name}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: 2 }}>
            {rule.selector.length > 40 ? `${rule.selector.slice(0, 40)}...` : rule.selector}
          </code>
          {rule.wcagTags.length > 0 && (
            <span style={{ marginLeft: 8 }}>
              {rule.wcagTags.slice(0, 2).join(', ')}
              {rule.wcagTags.length > 2 && ` +${rule.wcagTags.length - 2}`}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={onEdit} style={iconButtonStyle} title="Edit">✏️</button>
        <button onClick={onDelete} style={{ ...iconButtonStyle, color: '#dc2626' }} title="Delete">🗑️</button>
      </div>
    </div>
  );
}

// ============================================
// Small Helper Components
// ============================================

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

interface WcagTagButtonProps {
  tag: string;
  isSelected: boolean;
  onClick: () => void;
}

function WcagTagButton({ tag, isSelected, onClick }: WcagTagButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        borderRadius: 4,
        border: '1px solid',
        borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
        background: isSelected ? '#eff6ff' : '#fff',
        color: isSelected ? '#3b82f6' : '#64748b',
        cursor: 'pointer',
      }}
    >
      {tag}
    </button>
  );
}

interface SeverityBadgeProps {
  severity: RuleSeverity;
}

function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colors: Record<RuleSeverity, string> = {
    critical: '#dc2626',
    serious: '#ea580c',
    moderate: '#ca8a04',
    minor: '#2563eb',
  };

  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: `${colors[severity]}15`,
      color: colors[severity],
      textTransform: 'uppercase',
    }}>
      {severity}
    </span>
  );
}

// ============================================
// Styles
// ============================================

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 6,
  borderRadius: 4,
  color: '#64748b',
};