import type { SavedScan, PdfExportSettings } from '../../types';
import { SEVERITY_COLORS } from '../constants';
import { hexToRgb, addPdfFooter, addPdfHeader } from './pdfUtils';

interface TrendsPDFData {
  scans: SavedScan[];
  settings: PdfExportSettings;
  scoreGoal: number;
}

export async function generateTrendsPDF({
  scans,
  settings,
  scoreGoal,
}: TrendsPDFData): Promise<void> {
  if (scans.length === 0) {
    throw new Error('No scan data to export');
  }

  // Dynamic import for code splitting - jsPDF is only loaded when needed
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header
  yPosition = addPdfHeader(
    pdf,
    margin,
    settings.companyName || 'AllyLab',
    'Accessibility Trends Report',
    `Generated on ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`
  );

  // Summary Stats
  if (settings.includeStats) {
    const sortedScans = [...scans].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const latest = sortedScans[sortedScans.length - 1];
    const first = sortedScans[0];

    const avgScore = Math.round(
      scans.reduce((sum, s) => sum + s.score, 0) / scans.length
    );
    const scoreImprovement = latest.score - first.score;

    checkPageBreak(50);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary Statistics', margin, yPosition);
    yPosition += 10;

    const statsData = [
      { label: 'Current Score', value: `${latest.score}/100` },
      { label: 'Average Score', value: `${avgScore}/100` },
      {
        label: 'Score Change',
        value: `${scoreImprovement >= 0 ? '+' : ''}${scoreImprovement}`,
      },
      { label: 'Total Scans', value: `${scans.length}` },
      { label: 'Goal Score', value: `${scoreGoal}` },
      {
        label: 'Points to Goal',
        value: `${Math.max(scoreGoal - latest.score, 0)}`,
      },
    ];

    pdf.setFontSize(10);
    const colWidth = (pageWidth - 2 * margin) / 3;
    statsData.forEach((stat, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = margin + col * colWidth;
      const y = yPosition + row * 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(stat.label, x, y);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text(stat.value, x, y + 5);
    });

    yPosition += 35;
  }

  // Score Trend Table
  if (settings.includeScoreTrend) {
    checkPageBreak(80);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Score Trend (Last 20 Scans)', margin, yPosition);
    yPosition += 10;

    const sortedScans = [...scans]
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .slice(-20);

    const headers = [
      'Date',
      'Score',
      'Critical',
      'Serious',
      'Moderate',
      'Minor',
      'Total',
    ];
    const colWidths = [35, 20, 20, 20, 25, 20, 20];

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');

    let xPos = margin;
    headers.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition);
      xPos += colWidths[i];
    });
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    sortedScans.forEach((scan, index) => {
      if (checkPageBreak(8)) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
        xPos = margin;
        headers.forEach((header, i) => {
          pdf.text(header, xPos + 2, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
      }

      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, 'F');
      }

      const date = new Date(scan.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      });

      const rowData = [
        date,
        scan.score.toString(),
        scan.critical.toString(),
        scan.serious.toString(),
        scan.moderate.toString(),
        scan.minor.toString(),
        scan.totalIssues.toString(),
      ];

      xPos = margin;
      rowData.forEach((cell, i) => {
        pdf.text(cell, xPos + 2, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 7;
    });

    yPosition += 10;
  }

  // Issue Distribution
  if (settings.includeDistribution) {
    checkPageBreak(60);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Current Issue Distribution', margin, yPosition);
    yPosition += 10;

    const sortedScans = [...scans].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const latest = sortedScans[sortedScans.length - 1];
    const total = latest.totalIssues || 1;

    const distribution = [
      {
        label: 'Critical',
        value: latest.critical,
        color: SEVERITY_COLORS.critical,
      },
      {
        label: 'Serious',
        value: latest.serious,
        color: SEVERITY_COLORS.serious,
      },
      {
        label: 'Moderate',
        value: latest.moderate,
        color: SEVERITY_COLORS.moderate,
      },
      { label: 'Minor', value: latest.minor, color: SEVERITY_COLORS.minor },
    ];

    pdf.setFontSize(10);
    distribution.forEach((item) => {
      const percentage = Math.round((item.value / total) * 100);
      const barWidth = (item.value / total) * (pageWidth - 2 * margin - 80);

      pdf.setFont('helvetica', 'normal');
      pdf.text(item.label, margin, yPosition);

      const rgb = hexToRgb(item.color);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(margin + 30, yPosition - 4, barWidth, 6, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.text(
        `${item.value} (${percentage}%)`,
        margin + 35 + barWidth,
        yPosition
      );

      yPosition += 10;
    });

    yPosition += 10;
  }

  // Summary Text
  if (settings.includeSummary) {
    checkPageBreak(40);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', margin, yPosition);
    yPosition += 8;

    const sortedScans = [...scans].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const latest = sortedScans[sortedScans.length - 1];
    const first = sortedScans[0];
    const scoreChange = latest.score - first.score;
    const issueChange = latest.totalIssues - first.totalIssues;

    const summaryLines = [
      `Over ${scans.length} scans, the accessibility score has ${
        scoreChange >= 0 ? 'improved' : 'decreased'
      } by ${Math.abs(scoreChange)} points.`,
      `Total issues have ${
        issueChange <= 0 ? 'decreased' : 'increased'
      } by ${Math.abs(issueChange)} since the first scan.`,
      `Current score: ${latest.score}/100 (Goal: ${scoreGoal}/100)`,
      latest.score >= scoreGoal
        ? '✓ The accessibility goal has been reached!'
        : `${scoreGoal - latest.score} more points needed to reach the goal.`,
    ];

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    summaryLines.forEach((line) => {
      const wrappedLines = pdf.splitTextToSize(line, pageWidth - 2 * margin);
      wrappedLines.forEach((wLine: string) => {
        checkPageBreak(6);
        pdf.text(wLine, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 2;
    });
  }

  // Footer
  addPdfFooter(pdf, margin);

  // Save the PDF
  const filename = `accessibility-trends-${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  pdf.save(filename);
}
