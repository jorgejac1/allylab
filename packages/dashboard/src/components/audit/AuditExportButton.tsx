import { useState } from 'react';
import { Button } from '../ui';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';

interface AuditExportButtonProps {
  onExport: (format: 'json' | 'csv') => void;
}

export function AuditExportButton({ onExport }: AuditExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5"
      >
        <Download size={14} /> Export
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-20 py-1 min-w-[160px]">
            <button
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-slate-50 transition-colors"
              onClick={() => {
                onExport('json');
                setOpen(false);
              }}
            >
              <FileJson size={14} className="text-blue-500" /> Export as JSON
            </button>
            <button
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-slate-50 transition-colors"
              onClick={() => {
                onExport('csv');
                setOpen(false);
              }}
            >
              <FileSpreadsheet size={14} className="text-emerald-500" /> Export as CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
