import type { RuleType, RuleSeverity } from './types';

export const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'selector', label: 'Selector (CSS)' },
  { value: 'attribute', label: 'Attribute Check' },
  { value: 'content', label: 'Content Check' },
  { value: 'structure', label: 'Structure Check' },
];

export const SEVERITIES: { value: RuleSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'serious', label: 'Serious', color: '#ea580c' },
  { value: 'moderate', label: 'Moderate', color: '#ca8a04' },
  { value: 'minor', label: 'Minor', color: '#2563eb' },
];

export const OPERATORS: { value: string; label: string }[] = [
  { value: 'exists', label: 'Exists' },
  { value: 'not-exists', label: 'Does Not Exist' },
  { value: 'equals', label: 'Equals' },
  { value: 'not-equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'matches', label: 'Matches (Regex)' },
];

export const WCAG_TAGS = [
  'wcag2a', 'wcag2aa', 'wcag2aaa',
  'wcag21a', 'wcag21aa', 'wcag22aa',
  'best-practice', 'experimental',
];

export const SEVERITY_COLORS: Record<RuleSeverity, string> = {
  critical: '#dc2626',
  serious: '#ea580c',
  moderate: '#ca8a04',
  minor: '#2563eb',
};

export const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 6,
  borderRadius: 4,
  color: '#64748b',
};
