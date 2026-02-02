import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, ConfirmDialog, Toast } from '../../ui';
import { useCustomRules, useConfirmDialog, useToast, useRuleForm } from '../../../hooks';
import { RulesHeader } from './RulesHeader';
import { RuleForm } from './RuleForm';
import { RulesList } from './RulesList';
import type { CustomRule } from './types';

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
          <p role="alert" style={{ color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} aria-hidden="true" />{error}
          </p>
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
