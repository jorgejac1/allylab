import type { Finding, SavedScan } from '../types';

export function exportToCSV(findings: Finding[], filename: string): void {
  const headers = [
    'Severity',
    'Rule ID',
    'Rule Title',
    'Description',
    'Selector',
    'WCAG Tags',
    'Help URL',
  ];

  const rows = findings.map(f => [
    f.impact,
    f.ruleId,
    f.ruleTitle,
    `"${f.description.replace(/"/g, '""')}"`,
    `"${f.selector.replace(/"/g, '""')}"`,
    f.wcagTags.join('; '),
    f.helpUrl,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

export function exportToJSON(data: SavedScan | SavedScan[] | Finding[], filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}