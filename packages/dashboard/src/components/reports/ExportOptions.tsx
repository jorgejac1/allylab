import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card, Button, Modal } from '../ui';
import type { SavedScan } from '../../types';
import { exportToCSV, exportToJSON } from '../../utils/export';
import { Upload, FileText, Book, BarChart3, Wrench } from 'lucide-react';

interface ExportOptionsProps {
  scans: SavedScan[];
  selectedScan?: SavedScan;
}

export function ExportOptions({ scans, selectedScan }: ExportOptionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [exportType, setExportType] = useState<'single' | 'all'>('single');

  const handleExport = (format: 'csv' | 'json') => {
    const timestamp = Date.now();

    if (exportType === 'single' && selectedScan) {
      const hostname = new URL(selectedScan.url).hostname;
      const filename = `allylab-${hostname}-${timestamp}`;

      if (format === 'csv') {
        exportToCSV(selectedScan.trackedFindings || [], `${filename}.csv`);
      } else {
        exportToJSON(selectedScan, `${filename}.json`);
      }
    } else {
      const filename = `allylab-all-scans-${timestamp}`;

      if (format === 'csv') {
        const allFindings = scans.flatMap(s => s.trackedFindings || []);
        exportToCSV(allFindings, `${filename}.csv`);
      } else {
        exportToJSON(scans, `${filename}.json`);
      }
    }

    setShowModal(false);
  };

  return (
    <>
      <Card>
        <h4 className="text-base font-semibold mt-0 mb-4 inline-flex items-center gap-2">
          <Upload size={18} /> Export Options
        </h4>

        <div className="flex flex-col gap-3">
          <ExportButton
            icon={<FileText size={24} />}
            title="Export Current Scan"
            description="Download the selected scan results"
            disabled={!selectedScan}
            onClick={() => {
              setExportType('single');
              setShowModal(true);
            }}
          />

          <ExportButton
            icon={<Book size={24} />}
            title="Export All Scans"
            description={`Download all ${scans.length} scan results`}
            disabled={scans.length === 0}
            onClick={() => {
              setExportType('all');
              setShowModal(true);
            }}
          />
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Choose Export Format"
        size="sm"
      >
        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            onClick={() => handleExport('csv')}
            className="justify-start p-4 flex items-center"
          >
            <span className="mr-3"><BarChart3 size={20} /></span>
            <div className="text-left">
              <div className="font-semibold">CSV Format</div>
              <div className="text-xs text-slate-500">
                Best for spreadsheets and data analysis
              </div>
            </div>
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleExport('json')}
            className="justify-start p-4 flex items-center"
          >
            <span className="mr-3"><Wrench size={20} /></span>
            <div className="text-left">
              <div className="font-semibold">JSON Format</div>
              <div className="text-xs text-slate-500">
                Best for developers and integrations
              </div>
            </div>
          </Button>
        </div>
      </Modal>
    </>
  );
}

function ExportButton({
  icon,
  title,
  description,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 p-4 border border-slate-200 rounded-lg text-left w-full ${
        disabled
          ? 'bg-slate-50 cursor-not-allowed opacity-50'
          : 'bg-white cursor-pointer hover:bg-slate-50'
      }`}
    >
      <span className="inline-flex items-center">{icon}</span>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
    </button>
  );
}
