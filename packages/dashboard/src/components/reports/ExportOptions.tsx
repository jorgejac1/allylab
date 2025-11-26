import { useState } from 'react';
import { Card, Button, Modal } from '../ui';
import type { SavedScan } from '../../types';
import { exportToCSV, exportToJSON } from '../../utils/export';

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
        <h4 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          📤 Export Options
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ExportButton
            icon="📄"
            title="Export Current Scan"
            description="Download the selected scan results"
            disabled={!selectedScan}
            onClick={() => {
              setExportType('single');
              setShowModal(true);
            }}
          />

          <ExportButton
            icon="📚"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            variant="secondary"
            onClick={() => handleExport('csv')}
            style={{ justifyContent: 'flex-start', padding: 16 }}
          >
            <span style={{ marginRight: 12 }}>📊</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>CSV Format</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Best for spreadsheets and data analysis
              </div>
            </div>
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleExport('json')}
            style={{ justifyContent: 'flex-start', padding: 16 }}
          >
            <span style={{ marginRight: 12 }}>🔧</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>JSON Format</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
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
  icon: string;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        background: disabled ? '#f8fafc' : '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{description}</div>
      </div>
    </button>
  );
}