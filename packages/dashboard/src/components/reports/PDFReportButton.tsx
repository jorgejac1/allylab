import { useState } from 'react';
import { Button, Toast } from '../ui';
import { useToast } from '../../hooks';
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
  const { toasts, success, error, closeToast } = useToast();

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
      success('PDF report generated successfully');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Toast toasts={toasts} onClose={closeToast} />
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExport}
        disabled={isGenerating || sites.length === 0}
      >
        {isGenerating ? '⏳ Generating...' : '📄 Export PDF'}
      </Button>
    </>
  );
}