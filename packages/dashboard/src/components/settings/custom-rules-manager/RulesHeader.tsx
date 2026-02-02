import { Ruler, Download, Upload, Plus } from 'lucide-react';
import { Card, Button } from '../../ui';
import type { RulesHeaderProps } from './types';

export function RulesHeader({
  enabledRules, totalRules, rulesCount, fileInputRef,
  onImport, onExport, onNewRule,
}: RulesHeaderProps) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ruler size={18} aria-hidden="true" />Custom Accessibility Rules
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Create custom rules to extend built-in accessibility checks • {enabledRules}/{totalRules} enabled
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImport}
            style={{ display: 'none' }}
            aria-label="Import rules file"
          />
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Download size={14} aria-hidden="true" style={{ marginRight: 6 }} />Import
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport} disabled={rulesCount === 0}>
            <Upload size={14} aria-hidden="true" style={{ marginRight: 6 }} />Export
          </Button>
          <Button size="sm" onClick={onNewRule}>
            <Plus size={14} aria-hidden="true" style={{ marginRight: 6 }} />New Rule
          </Button>
        </div>
      </div>
    </Card>
  );
}
