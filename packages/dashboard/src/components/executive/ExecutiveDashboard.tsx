import { Card } from "../ui";
import { getScoreColor, getScoreGrade } from "../../utils/scoreUtils";
import { KPICard } from "./KPICard";
import { KPIGrid } from "./KPIGrid";
import { SeverityBreakdown } from "./SeverityBreakdown";
import { TopIssuesTable } from "./TopIssuesTable";
import { SiteRankings } from "./SiteRankings";
import { PDFReportButton } from "../reports";
import { useDashboardData } from "../../hooks";
import type { DrillDownTarget } from "../../types";
import { Target, Bug, AlertCircle, Globe, Flame, TrendingDown, BarChart3 } from "lucide-react";

interface ExecutiveDashboardProps {
  onDrillDown?: (target: DrillDownTarget) => void;
}

export function ExecutiveDashboard({ onDrillDown }: ExecutiveDashboardProps) {
  const data = useDashboardData();

  if (data.totalSites === 0) {
    return <EmptyDashboard />;
  }

  const handleClickSite = (url: string) => onDrillDown?.({ type: "site", url });
  const handleClickIssue = (ruleId: string) =>
    onDrillDown?.({ type: "issue", ruleId });

  // Prepare data for PDF export
  const pdfDashboardData = {
    averageScore: data.avgScore,
    totalIssues: data.totalIssues,
    sitesMonitored: data.totalSites,
    severity: data.severityCounts,
    overallTrend: data.overallTrend,
    criticalTrend: data.criticalTrend,
  };

  return (
    <div>
      {/* Export Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 24,
        }}
      >
        <PDFReportButton
          data={pdfDashboardData}
          sites={data.siteStats}
          topIssues={data.topIssues}
        />
      </div>

      {/* KPI Cards */}
      <KPIGrid>
        <KPICard
          icon={<Target size={20} />}
          label="Average Score"
          value={data.avgScore}
          subValue={`Grade ${getScoreGrade(data.avgScore)}`}
          color={getScoreColor(data.avgScore)}
          trend={data.overallTrend}
        />
        <KPICard
          icon={<Bug size={20} />}
          label="Total Issues"
          value={data.totalIssues.toLocaleString()}
          subValue="Across all sites"
        />
        <KPICard
          icon={<AlertCircle size={20} />}
          label="Critical Issues"
          value={data.severityCounts.critical}
          subValue="Requires immediate attention"
          color="#dc2626"
          trend={data.criticalTrend}
        />
        <KPICard
          icon={<Globe size={20} />}
          label="Sites Monitored"
          value={data.totalSites}
          subValue={`${data.totalScans} total scans`}
        />
      </KPIGrid>

      {/* Severity Breakdown */}
      <Card style={{ marginBottom: 24, padding: 20 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#111827",
            margin: "0 0 16px 0",
          }}
        >
          Issue Severity Distribution
        </h3>
        <SeverityBreakdown counts={data.severityCounts} />
      </Card>

      {/* Two Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 24,
        }}
      >
        <Card style={{ padding: 20 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Flame size={18} />Top Issues by Frequency
          </h3>
          <TopIssuesTable
            issues={data.topIssues}
            onClickIssue={handleClickIssue}
          />
        </Card>

        <Card style={{ padding: 20 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TrendingDown size={18} />Sites Needing Attention
          </h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            Ranked by accessibility score (lowest first)
          </p>
          <SiteRankings sites={data.siteStats} onClickSite={handleClickSite} />
        </Card>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", color: "#94a3b8" }}><BarChart3 size={48} /></div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#111827",
          marginBottom: 8,
        }}
      >
        No Data Yet
      </h2>
      <p style={{ color: "#6b7280", maxWidth: 400, margin: "0 auto" }}>
        Run some accessibility scans first. The executive dashboard aggregates
        data across all your scanned sites.
      </p>
    </div>
  );
}

export default ExecutiveDashboard;