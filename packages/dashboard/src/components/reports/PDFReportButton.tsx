import { useState } from 'react';
import { Button } from '../ui';
import { generateExecutiveReportPDF } from '../../utils/pdfExport';
import type { PDFDashboardData, SiteStats, TopIssue } from '../../types/executive';

interface PDFReportButtonProps {
  data: PDFDashboardData;
  sites: SiteStats[];
  topIssues: TopIssue[];
  companyName?: string;
}

export function PDFReportButton({ 
  data, 
  sites, 
  topIssues,
  companyName = 'AllyLab' 
}: PDFReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      await generateExecutiveReportPDF(data, sites, topIssues, {
        companyName,
        title: 'Accessibility Executive Report',
        dateRange: `Generated on ${new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={isGenerating || sites.length === 0}
    >
      {isGenerating ? '⏳ Generating...' : '📄 Export PDF'}
    </Button>
  );
}