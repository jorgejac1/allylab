import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Toast } from '../ui';
import { useToast } from '../../hooks';
import type { TrackedFinding } from '../../types';
import { getApiBase } from '../../utils/api';
import { Download, FileText, BarChart3, Braces } from 'lucide-react';

interface ExportDropdownProps {
  findings: TrackedFinding[];
  scanUrl: string;
  scanDate: string;
}

export function ExportDropdown({ findings, scanUrl, scanDate }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toasts, success, error, closeToast } = useToast();

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      if (format === 'excel') {
        await exportToExcel(findings, scanUrl, scanDate);
      } else {
        const response = await fetch(`${getApiBase()}/export/${format}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            findings: findings.map(f => ({
              id: f.id,
              ruleId: f.ruleId,
              ruleTitle: f.ruleTitle,
              description: f.description,
              impact: f.impact,
              selector: f.selector,
              wcagTags: f.wcagTags,
              status: f.status,
              falsePositive: f.falsePositive,
            })),
            scanUrl,
            scanDate,
            format,
          }),
        });

        if (!response.ok) {
          throw new Error(`Export failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `allylab-findings-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      success(`Exported ${findings.length} findings as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export failed:', err);
      error(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Toast Container */}
      <Toast toasts={toasts} onClose={closeToast} />

      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || findings.length === 0}
      >
        {isExporting ? 'Exporting...' : <span className="inline-flex items-center gap-1.5"><Download size={12} /> Export</span>}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-40 overflow-hidden">
            <DropdownItem
              icon={<FileText size={14} />}
              label="Export as CSV"
              onClick={() => handleExport('csv')}
            />
            <DropdownItem
              icon={<BarChart3 size={14} />}
              label="Export as Excel"
              onClick={() => handleExport('excel')}
            />
            <DropdownItem
              icon={<Braces size={14} />}
              label="Export as JSON"
              onClick={() => handleExport('json')}
              isLast
            />
          </div>
        </>
      )}
    </div>
  );
}

function DropdownItem({
  icon,
  label,
  onClick,
  isLast = false
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full py-2.5 px-3.5 bg-white hover:bg-slate-50 border-none text-sm text-slate-700 cursor-pointer text-left transition-colors duration-150 gap-2 ${
        isLast ? '' : 'border-b border-slate-100'
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

// Client-side Excel export using ExcelJS
async function exportToExcel(
  findings: TrackedFinding[],
  scanUrl: string,
  scanDate: string
) {
  const ExcelJS = await import('exceljs');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AllyLab';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Findings');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 15 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Rule ID', key: 'ruleId', width: 20 },
    { header: 'Issue Title', key: 'title', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Element Selector', key: 'selector', width: 30 },
    { header: 'WCAG Tags', key: 'wcagTags', width: 20 },
    { header: 'False Positive', key: 'falsePositive', width: 12 },
    { header: 'Scan URL', key: 'scanUrl', width: 30 },
    { header: 'Scan Date', key: 'scanDate', width: 20 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data rows
  findings.forEach(f => {
    const row = worksheet.addRow({
      id: f.id,
      severity: f.impact,
      status: f.status || 'new',
      ruleId: f.ruleId,
      title: f.ruleTitle,
      description: f.description,
      selector: f.selector,
      wcagTags: f.wcagTags.join(', '),
      falsePositive: f.falsePositive ? 'Yes' : 'No',
      scanUrl,
      scanDate,
    });

    // Color code severity
    const severityCell = row.getCell('severity');
    const severityColors: Record<string, string> = {
      critical: 'FFDC2626',
      serious: 'FFF97316',
      moderate: 'FFEAB308',
      minor: 'FF3B82F6',
    };
    if (severityColors[f.impact]) {
      severityCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: severityColors[f.impact] },
      };
      severityCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `allylab-findings-${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
