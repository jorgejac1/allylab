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
      <h3 className="text-base font-semibold mt-0 mb-4 inline-flex items-center gap-2">
        <Map size={18} /> Field Mapping
      </h3>

      <div className="flex flex-col gap-6">
        {/* Severity → Priority Mapping */}
        <div>
          <h4 className="text-sm font-semibold mt-0 mb-3 text-gray-700">
            Severity → JIRA Priority
          </h4>

          <div className="mb-3">
            <label className="block text-sm text-slate-500 mb-1">
              Target JIRA Field
            </label>
            <Input
              value={mapping.severity.field}
              onChange={e => handleSeverityFieldChange(e.target.value)}
              placeholder="priority"
              style={{ width: 200 }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEVERITIES.map(severity => (
              <div key={severity}>
                <label
                  className="block text-xs font-medium mb-1 capitalize"
                  style={{ color: getSeverityColor(severity) }}
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
          <h4 className="text-sm font-semibold mt-0 mb-3 text-gray-700">
            WCAG Tags → JIRA Labels
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-500 mb-1">
                Target Field
              </label>
              <Input
                value={mapping.wcagTags.field}
                onChange={e => handleWcagFieldChange(e.target.value)}
                placeholder="labels"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">
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
          <h4 className="text-sm font-semibold mt-0 mb-3 text-gray-700">
            Rule ID → JIRA Field
          </h4>
          <Input
            value={mapping.ruleId.field}
            onChange={e => onChange({ ...mapping, ruleId: { field: e.target.value } })}
            placeholder="labels or customfield_xxxxx"
            style={{ width: 300 }}
          />
          <p className="text-xs text-slate-500 mt-1">
            Use "labels" or a custom field ID (e.g., customfield_10001)
          </p>
        </div>

        {/* Preview */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <h4 className="text-sm font-semibold mt-0 mb-2 text-slate-500 inline-flex items-center gap-1.5">
            <ClipboardList size={14} /> Mapping Preview
          </h4>
          <pre className="text-xs font-mono text-slate-700 m-0 whitespace-pre-wrap">
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
