import jsPDF from "jspdf";
import type { SavedScan, PdfExportSettings } from "../types";
import type { PDFDashboardData, SiteStats, TopIssue } from "../types/executive";
import { SEVERITY_COLORS } from "./constants";

// ==============================================
// Trends PDF Export
// ==============================================

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
    throw new Error("No scan data to export");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper to add a new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ============ HEADER ============
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text(settings.companyName || "AllyLab", margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(16);
  pdf.setFont("helvetica", "normal");
  pdf.text("Accessibility Trends Report", margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(
    `Generated on ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    margin,
    yPosition
  );
  pdf.setTextColor(0);
  yPosition += 15;

  // ============ SUMMARY STATS ============
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
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary Statistics", margin, yPosition);
    yPosition += 10;

    // Stats grid
    const statsData = [
      { label: "Current Score", value: `${latest.score}/100` },
      { label: "Average Score", value: `${avgScore}/100` },
      {
        label: "Score Change",
        value: `${scoreImprovement >= 0 ? "+" : ""}${scoreImprovement}`,
      },
      { label: "Total Scans", value: `${scans.length}` },
      { label: "Goal Score", value: `${scoreGoal}` },
      {
        label: "Points to Goal",
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

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100);
      pdf.text(stat.label, x, y);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0);
      pdf.text(stat.value, x, y + 5);
    });

    yPosition += 35;
  }

  // ============ SCORE TREND TABLE ============
  if (settings.includeScoreTrend) {
    checkPageBreak(80);

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Score Trend (Last 20 Scans)", margin, yPosition);
    yPosition += 10;

    const sortedScans = [...scans]
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .slice(-20);

    // Table headers
    const headers = [
      "Date",
      "Score",
      "Critical",
      "Serious",
      "Moderate",
      "Minor",
      "Total",
    ];
    const colWidths = [35, 20, 20, 20, 25, 20, 20];

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, "F");

    let xPos = margin;
    headers.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition);
      xPos += colWidths[i];
    });
    yPosition += 8;

    // Table rows
    pdf.setFont("helvetica", "normal");
    sortedScans.forEach((scan, index) => {
      if (checkPageBreak(8)) {
        // Re-add headers on new page
        pdf.setFont("helvetica", "bold");
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, "F");
        xPos = margin;
        headers.forEach((header, i) => {
          pdf.text(header, xPos + 2, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 8;
        pdf.setFont("helvetica", "normal");
      }

      // Alternate row background
      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, "F");
      }

      const date = new Date(scan.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
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

  // ============ ISSUE DISTRIBUTION ============
  if (settings.includeDistribution) {
    checkPageBreak(60);

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Current Issue Distribution", margin, yPosition);
    yPosition += 10;

    const sortedScans = [...scans].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const latest = sortedScans[sortedScans.length - 1];
    const total = latest.totalIssues || 1;

    const distribution = [
      {
        label: "Critical",
        value: latest.critical,
        color: SEVERITY_COLORS.critical,
      },
      {
        label: "Serious",
        value: latest.serious,
        color: SEVERITY_COLORS.serious,
      },
      {
        label: "Moderate",
        value: latest.moderate,
        color: SEVERITY_COLORS.moderate,
      },
      { label: "Minor", value: latest.minor, color: SEVERITY_COLORS.minor },
    ];

    pdf.setFontSize(10);
    distribution.forEach((item) => {
      const percentage = Math.round((item.value / total) * 100);
      const barWidth = (item.value / total) * (pageWidth - 2 * margin - 80);

      // Label
      pdf.setFont("helvetica", "normal");
      pdf.text(item.label, margin, yPosition);

      // Bar
      const rgb = hexToRgb(item.color);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(margin + 30, yPosition - 4, barWidth, 6, "F");

      // Value
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `${item.value} (${percentage}%)`,
        margin + 35 + barWidth,
        yPosition
      );

      yPosition += 10;
    });

    yPosition += 10;
  }

  // ============ SUMMARY TEXT ============
  if (settings.includeSummary) {
    checkPageBreak(40);

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary", margin, yPosition);
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
        scoreChange >= 0 ? "improved" : "decreased"
      } by ${Math.abs(scoreChange)} points.`,
      `Total issues have ${
        issueChange <= 0 ? "decreased" : "increased"
      } by ${Math.abs(issueChange)} since the first scan.`,
      `Current score: ${latest.score}/100 (Goal: ${scoreGoal}/100)`,
      latest.score >= scoreGoal
        ? "✓ The accessibility goal has been reached!"
        : `${scoreGoal - latest.score} more points needed to reach the goal.`,
    ];

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
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

  // ============ FOOTER ============
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
    pdf.text("Generated by AllyLab", pageWidth - margin, pageHeight - 10, {
      align: "right",
    });
  }

  // Save the PDF
  const filename = `accessibility-trends-${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  pdf.save(filename);
}

// ==============================================
// Executive Report PDF Export (existing)
// ==============================================

// ==============================================
// Executive Report PDF Export (CORRECTED)
// ==============================================

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
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper to add a new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ============ HEADER ============
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text(options.companyName, margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(16);
  pdf.setFont("helvetica", "normal");
  pdf.text(options.title, margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(options.dateRange, margin, yPosition);
  pdf.setTextColor(0);
  yPosition += 15;

  // ============ KPI SUMMARY ============
  checkPageBreak(50);

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Key Performance Indicators", margin, yPosition);
  yPosition += 10;

  // Calculate trend from overallTrend array
  const trendChange =
    data.overallTrend.length >= 2
      ? data.overallTrend[data.overallTrend.length - 1] - data.overallTrend[0]
      : 0;

  const kpis = [
    { label: "Average Score", value: `${data.averageScore}/100` },
    { label: "Sites Monitored", value: data.sitesMonitored.toString() },
    { label: "Total Issues", value: data.totalIssues.toLocaleString() },
    { label: "Critical Issues", value: data.severity.critical.toString() },
    { label: "Serious Issues", value: data.severity.serious.toString() },
    {
      label: "Score Trend",
      value: `${trendChange >= 0 ? "+" : ""}${trendChange}`,
    },
  ];

  pdf.setFontSize(10);
  const colWidth = (pageWidth - 2 * margin) / 3;
  kpis.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * colWidth;
    const y = yPosition + row * 15;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100);
    pdf.text(kpi.label, x, y);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0);
    pdf.text(kpi.value, x, y + 5);
  });

  yPosition += 35;

  // ============ SITES TABLE ============
  if (sites.length > 0) {
    checkPageBreak(60);

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Site Rankings", margin, yPosition);
    yPosition += 10;

    const headers = ["Site", "Score", "Critical", "Serious", "Total"];
    const colWidths = [60, 25, 25, 25, 25];

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, "F");

    let xPos = margin;
    headers.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition);
      xPos += colWidths[i];
    });
    yPosition += 8;

    pdf.setFont("helvetica", "normal");
    sites.slice(0, 15).forEach((site, index) => {
      if (checkPageBreak(8)) {
        pdf.setFont("helvetica", "bold");
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, "F");
        xPos = margin;
        headers.forEach((header, i) => {
          pdf.text(header, xPos + 2, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 8;
        pdf.setFont("helvetica", "normal");
      }

      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, "F");
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

  // ============ TOP ISSUES TABLE ============
  if (topIssues.length > 0) {
    checkPageBreak(60);

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Top Issues", margin, yPosition);
    yPosition += 10;

    const headers = ["Issue", "Count", "Severity", "Affected Sites"];
    const colWidths = [70, 25, 30, 35];

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, "F");

    let xPos = margin;
    headers.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPosition);
      xPos += colWidths[i];
    });
    yPosition += 8;

    pdf.setFont("helvetica", "normal");
    topIssues.slice(0, 10).forEach((issue, index) => {
      if (checkPageBreak(8)) {
        pdf.setFont("helvetica", "bold");
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, "F");
        xPos = margin;
        headers.forEach((header, i) => {
          pdf.text(header, xPos + 2, yPosition);
          xPos += colWidths[i];
        });
        yPosition += 8;
        pdf.setFont("helvetica", "normal");
      }

      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, "F");
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

  // ============ FOOTER ============
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
    pdf.text("Generated by AllyLab", pageWidth - margin, pageHeight - 10, {
      align: "right",
    });
  }

  const filename = `executive-report-${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  pdf.save(filename);
}

// ==============================================
// Utility Functions
// ==============================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
