import { ClipboardList } from 'lucide-react';
import { Card } from '../../ui';
import { RuleItem } from './RuleItem';
import type { RulesListProps } from './types';

export function RulesList({ rules, loading, onEdit, onDelete, onToggle }: RulesListProps) {
  return (
    <Card>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ClipboardList size={18} aria-hidden="true" />Rules ({rules.length})
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
