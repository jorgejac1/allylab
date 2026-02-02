import { Pencil, Trash2 } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import { iconButtonStyle } from './constants';
import type { RuleItemProps } from './types';

export function RuleItem({ rule, onEdit, onDelete, onToggle }: RuleItemProps) {
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
          aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.name}`}
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
        <button
          onClick={onEdit}
          style={iconButtonStyle}
          title="Edit"
          aria-label={`Edit ${rule.name}`}
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
        <button
          onClick={onDelete}
          style={{ ...iconButtonStyle, color: '#dc2626' }}
          title="Delete"
          aria-label={`Delete ${rule.name}`}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
