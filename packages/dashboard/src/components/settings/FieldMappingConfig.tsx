import { Card, Input, Select } from '../ui';
import type { JiraFieldMapping, Severity } from '../../types';
import { Map, ClipboardList } from 'lucide-react';

interface FieldMappingConfigProps {
  mapping: JiraFieldMapping;
  onChange: (mapping: JiraFieldMapping) => void;
}

const SEVERITIES: Severity[] = ['critical', 'serious', 'moderate', 'minor'];

const JIRA_PRIORITIES = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];

export function FieldMappingConfig({ mapping, onChange }: FieldMappingConfigProps) {
  const handleSeverityFieldChange = (field: string) => {
    onChange({
      ...mapping,
      severity: { ...mapping.severity, field },
    });
  };

  const handleSeverityValueChange = (severity: Severity, value: string) => {
    onChange({
      ...mapping,
      severity: {
        ...mapping.severity,
        values: { ...mapping.severity.values, [severity]: value },
      },
    });
  };

  const handleWcagFieldChange = (field: string) => {
    onChange({
      ...mapping,
      wcagTags: { ...mapping.wcagTags, field },
    });
  };

  const handleWcagPrefixChange = (prefix: string) => {
    onChange({
      ...mapping,
      wcagTags: { ...mapping.wcagTags, prefix },
    });
  };

  return (
    <Card>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Map size={18} /> Field Mapping
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Severity → Priority Mapping */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>
            Severity → JIRA Priority
          </h4>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>
              Target JIRA Field
            </label>
            <Input
              value={mapping.severity.field}
              onChange={e => handleSeverityFieldChange(e.target.value)}
              placeholder="priority"
              style={{ width: 200 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {SEVERITIES.map(severity => (
              <div key={severity}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 500,
                    marginBottom: 4,
                    textTransform: 'capitalize',
                    color: getSeverityColor(severity),
                  }}
                >
                  {severity}
                </label>
                <Select
                  value={mapping.severity.values[severity]}
                  onChange={e => handleSeverityValueChange(severity, e.target.value)}
                  options={JIRA_PRIORITIES.map(p => ({ value: p, label: p }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* WCAG Tags Mapping */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>
            WCAG Tags → JIRA Labels
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                Target Field
              </label>
              <Input
                value={mapping.wcagTags.field}
                onChange={e => handleWcagFieldChange(e.target.value)}
                placeholder="labels"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                Label Prefix
              </label>
              <Input
                value={mapping.wcagTags.prefix || ''}
                onChange={e => handleWcagPrefixChange(e.target.value)}
                placeholder="wcag-"
              />
            </div>
          </div>
        </div>

        {/* Rule ID Mapping */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>
            Rule ID → JIRA Field
          </h4>
          <Input
            value={mapping.ruleId.field}
            onChange={e => onChange({ ...mapping, ruleId: { field: e.target.value } })}
            placeholder="labels or customfield_xxxxx"
            style={{ width: 300 }}
          />
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Use "labels" or a custom field ID (e.g., customfield_10001)
          </p>
        </div>

        {/* Preview */}
        <div
          style={{
            padding: 16,
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}
        >
          <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ClipboardList size={14} /> Mapping Preview
          </h4>
          <pre
            style={{
              fontSize: 12,
              fontFamily: 'monospace',
              color: '#334155',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
{`critical → ${mapping.severity.values.critical}
serious  → ${mapping.severity.values.serious}
moderate → ${mapping.severity.values.moderate}
minor    → ${mapping.severity.values.minor}

WCAG tags → ${mapping.wcagTags.field} (prefix: "${mapping.wcagTags.prefix || ''}")
Rule ID   → ${mapping.ruleId.field}`}
          </pre>
        </div>
      </div>
    </Card>
  );
}

function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    critical: '#dc2626',
    serious: '#ea580c',
    moderate: '#ca8a04',
    minor: '#2563eb',
  };
  return colors[severity];
}