import { Ruler, Download, Upload, Plus } from 'lucide-react';
import { Card, Button } from '../../ui';
import { PermissionGuard } from '../../guards/RoleGuard';
import type { RulesHeaderProps } from './types';

export function RulesHeader({
  enabledRules, totalRules, rulesCount, fileInputRef,
  onImport, onExport, onNewRule,
}: RulesHeaderProps) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-semibold mb-1 mt-0 flex items-center gap-2">
            <Ruler size={18} aria-hidden="true" />Custom Accessibility Rules
          </h3>
          <p className="text-sm text-slate-500 m-0">
            Create custom rules to extend built-in accessibility checks • {enabledRules}/{totalRules} enabled
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImport}
            className="hidden"
            aria-label="Import rules file"
          />
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Download size={14} aria-hidden="true" className="mr-1.5" />Import
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport} disabled={rulesCount === 0}>
            <Upload size={14} aria-hidden="true" className="mr-1.5" />Export
          </Button>
          <PermissionGuard permission="rules:create">
            <Button size="sm" onClick={onNewRule}>
              <Plus size={14} aria-hidden="true" className="mr-1.5" />New Rule
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </Card>
  );
}
