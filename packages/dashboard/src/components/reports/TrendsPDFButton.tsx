import { useState } from 'react';
import { Button } from '../ui';
import { generateTrendsPDF } from '../../utils/pdfExport';
import type { SavedScan, PdfExportSettings } from '../../types';

interface TrendsPDFButtonProps {
  scans: SavedScan[];
  settings: PdfExportSettings;
  scoreGoal: number;
  disabled?: boolean;
}

export function TrendsPDFButton({
  scans,
  settings,
  scoreGoal,
  disabled = false,
}: TrendsPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (scans.length === 0) {
      setError('No scan data to export');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await generateTrendsPDF({
        scans,
        settings,
        scoreGoal,
      });
    } catch (err) {
      console.error('Failed to generate trends PDF:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExport}
        disabled={disabled || isGenerating || scans.length === 0}
      >
        {isGenerating ? '⏳ Generating...' : '📄 Export PDF'}
      </Button>
      {error && (
        <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>
      )}
    </div>
  );
}