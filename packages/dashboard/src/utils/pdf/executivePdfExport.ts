import type { PDFDashboardData, SiteStats, TopIssue } from '../../types/executive';
import { truncateText, addPdfFooter, addPdfHeader } from './pdfUtils';

interface ExecutivePDFOptions {
  companyName: string;
  title: string;
  dateRange: string;
}

export async function generateExecutiveReportPDF(
  data: PDFDashboardData,
  sites: SiteStats[],
  topIssues: TopIssue[],
  options: ExecutivePDFOptions
): Promise<void> {
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
    options.companyName,
    options.title,
    options.dateRange
  );

  // KPI Summary
  checkPageBreak(50);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Performance Indicators', margin, yPosition);
  yPosition += 10;

  const trendChange =
    data.overallTrend.length >= 2
      ? data.overallTrend[data.overallTrend.length - 1] - data.overallTrend[0]
      : 0;

  const kpis = [
    { label: 'Average Score', value: `${data.averageScore}/100` },
    { label: 'Sites Monitored', value: data.sitesMonitored.toString() },
    { label: 'Total Issues', value: data.totalIssues.toLocaleString() },
    { label: 'Critical Issues', value: data.severity.critical.toString() },
    { label: 'Serious Issues', value: data.severity.serious.toString() },
    {
      label: 'Score Trend',
      value: `${trendChange >= 0 ? '+' : ''}${trendChange}`,
    },
  ];

  pdf.setFontSize(10);
  const colWidth = (pageWidth - 2 * margin) / 3;
  kpis.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * colWidth;
    const y = yPosition + row * 15;

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(kpi.label, x, y);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text(kpi.value, x, y + 5);
  });

  yPosition += 35;

  // Sites Table
  if (sites.length > 0) {
    checkPageBreak(60);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Site Rankings', margin, yPosition);
    yPosition += 10;

    const headers = ['Site', 'Score', 'Critical', 'Serious', 'Total'];
    const colWidths = [60, 25, 25, 25, 25];

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
    sites.slice(0, 15).forEach((site, index) => {
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

      const rowData = [
        truncateText(site.domain, 25),
        site.latestScore.toString(),
        site.critical.toString(),
        site.serious.toString(),
        site.latestIssues.toString(),
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

  // Top Issues Table
  if (topIssues.length > 0) {
    checkPageBreak(60);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Top Issues', margin, yPosition);
    yPosition += 10;

    const headers = ['Issue', 'Count', 'Severity', 'Affected Sites'];
    const colWidths = [70, 25, 30, 35];

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
    topIssues.slice(0, 10).forEach((issue, index) => {
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

      const rowData = [
        truncateText(issue.title, 30),
        issue.count.toString(),
        issue.severity,
        issue.affectedSites.toString(),
      ];

      xPos = margin;
      rowData.forEach((cell, i) => {
        pdf.text(cell, xPos + 2, yPosition);
        xPos += colWidths[i];
      });
      yPosition += 7;
    });
  }

  // Footer
  addPdfFooter(pdf, margin);

  const filename = `executive-report-${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  pdf.save(filename);
}
