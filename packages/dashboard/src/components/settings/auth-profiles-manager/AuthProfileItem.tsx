import { Key, PlayCircle, ToggleLeft, ToggleRight, Edit2, Trash2, Globe } from 'lucide-react';
import { Card } from '../../ui';
import { getAuthMethodLabel } from '../../../utils/authProfiles';
import { METHOD_OPTIONS } from './constants';
import { HealthBadge } from './HealthBadge';
import type { AuthProfileItemProps, AuthMethod } from './types';

function getMethodIcon(method: AuthMethod) {
  return METHOD_OPTIONS.find(m => m.value === method)?.icon || <Key size={20} />;
}

export function AuthProfileItem({ profile, onEdit, onDelete, onToggle, onTest }: AuthProfileItemProps) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-[10px] flex items-center justify-center"
          style={{
            background: profile.enabled ? '#eff6ff' : '#f1f5f9',
            color: profile.enabled ? '#3b82f6' : '#94a3b8',
          }}
        >
          {getMethodIcon(profile.method)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="m-0 text-[15px] font-semibold">{profile.name}</h4>
            <span
              className="py-0.5 px-2 rounded text-[11px] font-medium"
              style={{
                background: profile.enabled ? '#dcfce7' : '#f1f5f9',
                color: profile.enabled ? '#166534' : '#64748b',
              }}
            >
              {getAuthMethodLabel(profile.method)}
            </span>
            {profile.enabled && <HealthBadge profile={profile} />}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Globe size={12} className="text-slate-400" />
            <span className="text-xs text-slate-500">
              {profile.domains.join(', ')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTest}
            className="p-2 border-none bg-transparent cursor-pointer text-blue-500"
            title="Test Profile"
          >
            <PlayCircle size={18} />
          </button>
          <button
            onClick={onToggle}
            className="p-2 border-none bg-transparent cursor-pointer"
            style={{ color: profile.enabled ? '#22c55e' : '#94a3b8' }}
            title={profile.enabled ? 'Disable' : 'Enable'}
          >
            {profile.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 border-none bg-transparent cursor-pointer text-slate-500"
            title="Edit"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 border-none bg-transparent cursor-pointer text-red-500"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </Card>
  );
}
