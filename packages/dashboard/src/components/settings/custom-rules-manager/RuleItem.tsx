import { Pencil, Trash2 } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import { iconButtonClass } from './constants';
import type { RuleItemProps } from './types';

export function RuleItem({ rule, onEdit, onDelete, onToggle }: RuleItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{
        background: rule.enabled ? '#f8fafc' : '#f1f5f9',
        opacity: rule.enabled ? 1 : 0.7,
      }}
    >
      <label className="cursor-pointer">
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={onToggle}
          aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.name}`}
          className="w-[18px] h-[18px]"
        />
      </label>

      <SeverityBadge severity={rule.severity} />

      <div className="flex-1">
        <div className="font-medium text-sm">{rule.name}</div>
        <div className="text-xs text-slate-500">
          <code className="bg-slate-200 py-px px-1 rounded-sm">
            {rule.selector.length > 40 ? `${rule.selector.slice(0, 40)}...` : rule.selector}
          </code>
          {rule.wcagTags.length > 0 && (
            <span className="ml-2">
              {rule.wcagTags.slice(0, 2).join(', ')}
              {rule.wcagTags.length > 2 && ` +${rule.wcagTags.length - 2}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        <button
          onClick={onEdit}
          className={iconButtonClass}
          title="Edit"
          aria-label={`Edit ${rule.name}`}
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
        <button
          onClick={onDelete}
          className={`${iconButtonClass} text-red-600`}
          title="Delete"
          aria-label={`Delete ${rule.name}`}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
