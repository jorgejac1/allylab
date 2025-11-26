import { useState } from 'react';
import { Button } from '../ui';
import type { TrackedFinding } from '../../types';

interface ExportDropdownProps {
  findings: TrackedFinding[];
  scanUrl: string;
  scanDate: string;
}

const API_BASE = 'http://localhost:3001';

export function ExportDropdown({ findings, scanUrl, scanDate }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      if (format === 'excel') {
        await exportToExcel(findings, scanUrl, scanDate);
      } else {
        const response = await fetch(`${API_BASE}/export/${format}`, {
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
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || findings.length === 0}
      >
        {isExporting ? 'Exporting...' : '📥 Export'}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 20,
              minWidth: 160,
              overflow: 'hidden',
            }}
          >
            <DropdownItem 
              icon="📄" 
              label="Export as CSV" 
              onClick={() => handleExport('csv')} 
            />
            <DropdownItem 
              icon="📊" 
              label="Export as Excel" 
              onClick={() => handleExport('excel')} 
            />
            <DropdownItem 
              icon="{ }" 
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
  icon: string; 
  label: string; 
  onClick: () => void; 
  isLast?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '10px 14px',
        background: isHovered ? '#f8fafc' : 'none',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
        fontSize: 14,
        color: '#334155',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
        gap: 8,
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

// Client-side Excel export
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