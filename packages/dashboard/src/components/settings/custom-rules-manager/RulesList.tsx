import { ClipboardList } from 'lucide-react';
import { Card } from '../../ui';
import { RuleItem } from './RuleItem';
import type { RulesListProps } from './types';

export function RulesList({ rules, loading, onEdit, onDelete, onToggle }: RulesListProps) {
  return (
    <Card>
      <h3 className="text-base font-semibold mt-0 mb-4 flex items-center gap-2">
        <ClipboardList size={18} aria-hidden="true" />Rules ({rules.length})
      </h3>

      {loading && rules.length === 0 ? (
        <p className="text-slate-500 text-center p-6">Loading rules...</p>
      ) : rules.length === 0 ? (
        <p className="text-slate-500 text-center p-6">
          No custom rules yet. Create one to get started!
        </p>
      ) : (
        <div className="flex flex-col gap-2">
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
