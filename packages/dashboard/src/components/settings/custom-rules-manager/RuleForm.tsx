import { Pencil, Plus, FlaskConical, Play, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button, Input, Select } from '../../ui';
import { FormField } from './FormField';
import { WcagTagButton } from './WcagTagButton';
import { RULE_TYPES, SEVERITIES, OPERATORS, WCAG_TAGS } from './constants';
import type { RuleFormProps, RuleType, RuleSeverity, RuleCondition } from './types';

export function RuleForm({
  formData, editingRule, testHtml, testResults, loading,
  onUpdateField, onUpdateCondition, onToggleWcagTag,
  onTestHtmlChange, onTest, onSubmit, onCancel,
}: RuleFormProps) {
  return (
    <Card>
      <h3 className="text-base font-semibold mt-0 mb-4 flex items-center gap-2">
        {editingRule ? <><Pencil size={18} aria-hidden="true" />Edit Rule</> : <><Plus size={18} aria-hidden="true" />Create New Rule</>}
      </h3>

      <div className="flex flex-col gap-4">
        {/* Row 1: Name & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
          <FormField label="Rule Name *">
            <Input
              value={formData.name}
              onChange={e => onUpdateField('name', e.target.value)}
              placeholder="e.g., Skip Navigation Link"
              aria-required="true"
            />
          </FormField>
          <FormField label="Type *">
            <Select
              value={formData.type}
              onChange={e => onUpdateField('type', e.target.value as RuleType)}
              options={RULE_TYPES}
              aria-required="true"
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
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
          <FormField label="CSS Selector *">
            <Input
              value={formData.selector}
              onChange={e => onUpdateField('selector', e.target.value)}
              placeholder="e.g., body > a[href^='#']:first-child"
              className="font-mono"
              aria-required="true"
            />
          </FormField>
          <FormField label="Severity *">
            <Select
              value={formData.severity}
              onChange={e => onUpdateField('severity', e.target.value as RuleSeverity)}
              options={SEVERITIES}
              aria-required="true"
            />
          </FormField>
        </div>

        {/* Row 4: Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
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
          <div className="flex flex-wrap gap-2">
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
        <div className="border-t border-slate-200 pt-4">
          <FormField label={<span className="flex items-center gap-1.5"><FlaskConical size={14} aria-hidden="true" />Test Rule (optional)</span>}>
            <textarea
              value={testHtml}
              onChange={e => onTestHtmlChange(e.target.value)}
              placeholder="Paste HTML to test the rule against..."
              aria-label="HTML to test rule against"
              className="w-full h-[100px] p-3 rounded-md border border-slate-200 font-mono text-[13px] resize-y"
            />
          </FormField>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" size="sm" onClick={onTest}>
              <Play size={14} aria-hidden="true" className="mr-1.5" />Run Test
            </Button>
            {testResults && (
              <span
                className="text-sm font-medium flex items-center gap-1.5"
                style={{ color: testResults.passed ? '#10b981' : '#dc2626' }}
              >
                {testResults.passed
                  ? <><CheckCircle size={14} aria-hidden="true" />Passed</>
                  : <><XCircle size={14} aria-hidden="true" />{testResults.violations.length} violation(s) found</>}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
