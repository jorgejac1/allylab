import { Download, Upload, Plus } from 'lucide-react';
import { Button } from '../../ui';
import type { ProfilesHeaderProps } from './types';

export function ProfilesHeader({ profilesCount, onExport, onImport, onCreate }: ProfilesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 className="m-0 text-base font-semibold">Authentication Profiles</h3>
        <p className="mt-1 mb-0 text-sm text-slate-500">
          Configure authentication for scanning protected pages (dashboards, admin panels)
        </p>
      </div>
      <div className="flex gap-2">
        {profilesCount > 0 && (
          <Button variant="secondary" onClick={onExport}>
            <Download size={16} className="mr-1.5" />
            Export
          </Button>
        )}
        <Button variant="secondary" onClick={onImport}>
          <Upload size={16} className="mr-1.5" />
          Import
        </Button>
        <Button onClick={onCreate}>
          <Plus size={16} className="mr-1.5" />
          Add Profile
        </Button>
      </div>
    </div>
  );
}
