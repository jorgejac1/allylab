import { Card } from "../ui";
import { getScoreColor, getScoreGrade } from "../../utils/scoreUtils";
import { KPICard } from "./KPICard";
import { KPIGrid } from "./KPIGrid";
import { SeverityBreakdown } from "./SeverityBreakdown";
import { TopIssuesTable } from "./TopIssuesTable";
import { SiteRankings } from "./SiteRankings";
import { GoalProgress, Sparkline } from "../charts";
import { PDFReportButton } from "../reports";
import { useDashboardData, useDashboardLayout } from "../../hooks";
import { CustomizeButton, WidgetTogglePanel, DraggableWidget } from "./customization";
import type { DrillDownTarget, WidgetId } from "../../types";
import { Target, Bug, AlertCircle, Globe, Flame, TrendingDown, BarChart3 } from "lucide-react";

interface ExecutiveDashboardProps {
  onDrillDown?: (target: DrillDownTarget) => void;
}

export function ExecutiveDashboard({ onDrillDown }: ExecutiveDashboardProps) {
  const data = useDashboardData();
  const {
    layout,
    isEditing,
    toggleWidget,
    reorderWidgets,
    resizeWidget,
    startEditing,
    saveEdits,
    cancelEdits,
    resetToDefaults,
  } = useDashboardLayout();

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

  // Map widget IDs to their rendered JSX
  const WIDGET_MAP: Record<WidgetId, React.ReactNode> = {
    'kpi-cards': (
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
    ),

    'severity-breakdown': (
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 m-0 mb-4">
          Issue Severity Distribution
        </h3>
        <SeverityBreakdown counts={data.severityCounts} />
      </Card>
    ),

    'top-issues': (
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 m-0 mb-4 flex items-center gap-2">
          <Flame size={18} />Top Issues by Frequency
        </h3>
        <TopIssuesTable
          issues={data.topIssues}
          onClickIssue={handleClickIssue}
        />
      </Card>
    ),

    'site-rankings': (
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 m-0 mb-4 flex items-center gap-2">
          <TrendingDown size={18} />Sites Needing Attention
        </h3>
        <p className="text-sm/[normal] text-gray-500 mb-4">
          Ranked by accessibility score (lowest first)
        </p>
        <SiteRankings sites={data.siteStats} onClickSite={handleClickSite} />
      </Card>
    ),

    'goal-progress': (
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 m-0 mb-4">
          Goal Progress
        </h3>
        <GoalProgress currentScore={data.avgScore} goalScore={90} />
      </Card>
    ),

    'score-trend': (
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900 m-0 mb-4">
          Score Trend
        </h3>
        {data.overallTrend.length >= 2 ? (
          <Sparkline
            data={data.overallTrend}
            width={200}
            height={60}
            color="auto"
            showDots
          />
        ) : (
          <p className="text-sm text-gray-400">Not enough data</p>
        )}
      </Card>
    ),
  };

  // Get enabled widgets sorted by position
  const enabledWidgets = [...layout.widgets]
    .filter(w => w.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <div>
      {/* Header: Export + Customize */}
      <div className="flex justify-end items-center gap-3 mb-6">
        <CustomizeButton
          isEditing={isEditing}
          onStartEdit={startEditing}
          onSave={saveEdits}
          onCancel={cancelEdits}
          onReset={resetToDefaults}
        />
        <PDFReportButton
          data={pdfDashboardData}
          sites={data.siteStats}
          topIssues={data.topIssues}
        />
      </div>

      {/* Widget Toggle Panel (visible in edit mode) */}
      {isEditing && (
        <WidgetTogglePanel
          widgets={layout.widgets}
          onToggle={toggleWidget}
          onReorder={reorderWidgets}
          onResize={resizeWidget}
        />
      )}

      {/* Dynamic Widget Grid */}
      <div className="grid grid-cols-2 gap-6">
        {enabledWidgets.map(widget => (
          <div
            key={widget.id}
            className={widget.size === 'full' ? 'col-span-2' : 'col-span-1'}
          >
            <DraggableWidget
              isEditing={isEditing}
              label={widget.label}
              size={widget.size}
            >
              {WIDGET_MAP[widget.id]}
            </DraggableWidget>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="p-10 text-center">
      <div className="mb-4 flex justify-center text-gray-400"><BarChart3 size={48} /></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No Data Yet
      </h2>
      <p className="text-gray-500 max-w-[400px] mx-auto">
        Run some accessibility scans first. The executive dashboard aggregates
        data across all your scanned sites.
      </p>
    </div>
  );
}

export default ExecutiveDashboard;
