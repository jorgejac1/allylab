import { Lock } from 'lucide-react';
import { Card } from '../../ui';
import { AuthProfileItem } from './AuthProfileItem';
import type { AuthProfileListProps } from './types';

export function AuthProfileList({ profiles, onEdit, onDelete, onToggle, onTest }: AuthProfileListProps) {
  if (profiles.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 px-4 text-slate-500">
          <Lock size={48} className="mb-3 opacity-50 mx-auto" />
          <p className="m-0 text-sm">
            No authentication profiles yet. Add one to scan protected pages.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {profiles.map(profile => (
        <AuthProfileItem
          key={profile.id}
          profile={profile}
          onEdit={() => onEdit(profile)}
          onDelete={() => onDelete(profile.id)}
          onToggle={() => onToggle(profile.id)}
          onTest={() => onTest(profile)}
        />
      ))}
    </div>
  );
}
