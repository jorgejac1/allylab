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
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {editingRule ? <><Pencil size={18} aria-hidden="true" />Edit Rule</> : <><Plus size={18} aria-hidden="true" />Create New Rule</>}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Row 1: Name & Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <FormField label="CSS Selector *">
            <Input
              value={formData.selector}
              onChange={e => onUpdateField('selector', e.target.value)}
              placeholder="e.g., body > a[href^='#']:first-child"
              style={{ fontFamily: 'monospace' }}
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
          <FormField label={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FlaskConical size={14} aria-hidden="true" />Test Rule (optional)</span>}>
            <textarea
              value={testHtml}
              onChange={e => onTestHtmlChange(e.target.value)}
              placeholder="Paste HTML to test the rule against..."
              aria-label="HTML to test rule against"
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
              <Play size={14} aria-hidden="true" style={{ marginRight: 6 }} />Run Test
            </Button>
            {testResults && (
              <span style={{
                fontSize: 14,
                color: testResults.passed ? '#10b981' : '#dc2626',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                {testResults.passed
                  ? <><CheckCircle size={14} aria-hidden="true" />Passed</>
                  : <><XCircle size={14} aria-hidden="true" />{testResults.violations.length} violation(s) found</>}
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
