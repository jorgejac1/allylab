import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button, Modal } from '../../ui';
import { importProfiles } from '../../../utils/authProfiles';
import type { ImportModalProps } from './types';

export function ImportModal({ isOpen, onClose, onImported }: ImportModalProps) {
  const [importJson, setImportJson] = useState('');
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const handleImport = () => {
    const result = importProfiles(importJson, importOverwrite);
    setImportResult(result);
    if (result.imported > 0) {
      onImported();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setImportJson('');
    setImportOverwrite(false);
    setImportResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Authentication Profiles"
    >
      <div className="flex flex-col gap-5">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Upload JSON file</label>
          <input
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="w-full py-2.5 px-3.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 cursor-pointer"
          />
        </div>

        <div className="text-center text-slate-400 text-sm">or</div>

        {/* JSON Textarea */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Paste JSON</label>
          <textarea
            placeholder="Paste exported profiles JSON here..."
            value={importJson}
            onChange={e => setImportJson(e.target.value)}
            className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-xs font-mono outline-none transition-[border-color] duration-150 min-h-[150px]"
          />
        </div>

        {/* Overwrite option */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={importOverwrite}
            onChange={e => setImportOverwrite(e.target.checked)}
          />
          <span className="text-sm text-slate-600">
            Overwrite existing profiles with same name
          </span>
        </label>

        {/* Import Result */}
        {importResult && (
          <div
            className="p-3 rounded-lg"
            style={{
              background: importResult.imported > 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${importResult.imported > 0 ? '#86efac' : '#fecaca'}`,
            }}
          >
            {importResult.imported > 0 && (
              <div className="text-green-800 text-sm font-medium">
                ✓ Successfully imported {importResult.imported} profile{importResult.imported > 1 ? 's' : ''}
              </div>
            )}
            {importResult.errors.length > 0 && (
              <ul className="mt-2 mb-0 pl-5 text-red-600 text-sm">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>
            {importResult?.imported ? 'Done' : 'Cancel'}
          </Button>
          {!importResult?.imported && (
            <Button onClick={handleImport} disabled={!importJson.trim()}>
              <Upload size={16} className="mr-1.5" />
              Import
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
