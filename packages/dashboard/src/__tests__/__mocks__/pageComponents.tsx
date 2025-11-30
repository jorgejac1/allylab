import type { ReactNode, ChangeEvent } from "react";

type ContainerProps = { title?: ReactNode; subtitle?: ReactNode; children?: ReactNode };
type BasicProps = { children?: ReactNode; [key: string]: unknown };

export const PageContainer = ({ title, subtitle, children }: ContainerProps) => (
  <div data-testid="page-container">
    {title && <div data-testid="page-title">{title}</div>}
    {subtitle && <div data-testid="page-subtitle">{subtitle}</div>}
    <div data-testid="page-content">{children}</div>
  </div>
);

export const CompetitorBenchmark = ({ yourSiteUrl, yourSiteScore }: { yourSiteUrl?: string; yourSiteScore?: number }) => (
  <div data-testid="competitor-benchmark" data-url={yourSiteUrl ?? ""} data-score={yourSiteScore ?? ""} />
);

export const ExecutiveDashboard = ({ onDrillDown }: { onDrillDown?: (payload: unknown) => void }) => (
  <button type="button" data-testid="executive-dashboard" onClick={() => onDrillDown?.({ target: "drill" })}>
    ExecutiveDashboard
  </button>
);

export const ReportsView = ({
  scans,
  recentRegressions,
  hasRegression,
}: {
  scans: unknown[];
  recentRegressions: unknown[];
  hasRegression: boolean;
  onDeleteScan?: (id: string) => void;
}) => (
  <div
    data-testid="reports-view"
    data-scan-count={scans.length}
    data-regression-count={recentRegressions.length}
    data-has-regression={hasRegression ? "true" : "false"}
  />
);

export const ScanForm = ({
  onScan,
  isScanning,
  initialUrl,
}: {
  onScan: (url: string, options: { standard: string; viewport: string }) => void;
  isScanning: boolean;
  initialUrl?: string;
}) => (
  <div data-testid="scan-form" data-initial-url={initialUrl ?? ""}>
    <button
      type="button"
      data-testid="trigger-scan"
      disabled={isScanning}
      onClick={() => onScan("https://scan.me", { standard: "wcag21aa", viewport: "desktop" })}
    >
      Start Scan
    </button>
  </div>
);

export const ScanProgress = ({ percent, message }: { percent: number; message: string }) => (
  <div data-testid="scan-progress">{`${percent}:${message}`}</div>
);

export const ScanResults = ({ scan, onRescan }: { scan: { findings: unknown[] }; onRescan?: () => void }) => (
  <div data-testid="scan-results" data-findings={scan.findings.length}>
    <button type="button" data-testid="rescan" onClick={onRescan}>
      Rescan
    </button>
  </div>
);

export const EmptyState = ({ title }: { title?: string }) => (
  <div data-testid="empty-state">{title ?? "empty"}</div>
);

export const Button = ({ onClick, children, ...rest }: BasicProps & { onClick?: () => void }) => (
  <button type="button" data-testid={typeof rest["data-testid"] === "string" ? (rest["data-testid"] as string) : undefined} onClick={onClick}>
    {children}
  </button>
);

export const Card = ({ children }: BasicProps) => <div data-testid="card">{children}</div>;

export const Input = ({ value, onChange }: { value?: number | string; onChange?: (event: ChangeEvent<HTMLInputElement>) => void }) => (
  <input data-testid="input" value={value ?? ""} onChange={onChange} />
);

export const Select = ({
  value,
  onChange,
  options,
}: {
  value?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  options?: Array<{ value: string; label: string }>;
}) => (
  <select data-testid="select" value={value} onChange={onChange}>
    {options?.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onChange: (id: string) => void;
}) => (
  <div data-testid="tabs">
    {tabs.map((tab) => (
      <button key={tab.id} type="button" data-active={tab.id === activeTab ? "true" : "false"} onClick={() => onChange(tab.id)}>
        {tab.label}
      </button>
    ))}
  </div>
);

export const ConfirmDialog = ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="confirm-dialog">open</div> : null);

export const Toast = ({ toasts, onClose }: { toasts: Array<{ id?: string; message?: string }>; onClose?: (id: string) => void }) => (
  <div data-testid="toast-container">
    {toasts.map((toast) => (
      <button key={toast.id ?? toast.message} type="button" onClick={() => toast.id && onClose?.(toast.id)}>
        {toast.message}
      </button>
    ))}
  </div>
);

export const SiteScanner = () => <div data-testid="site-scanner">SiteScanner</div>;

const Placeholder = ({ label }: { label: string }) => <div data-testid={label.replace(/\s+/g, "-").toLowerCase()}>{label}</div>;

export const CICDGenerator = () => <Placeholder label="cicd-generator" />;
export const JiraSettings = () => <Placeholder label="jira-settings" />;
export const ScheduleManager = () => <Placeholder label="schedule-manager" />;
export const WebhookManager = () => <Placeholder label="webhook-manager" />;
export const GitHubSettings = () => <Placeholder label="github-settings" />;
export const AlertSettings = () => <Placeholder label="alert-settings" />;
export const ReportSettings = () => <Placeholder label="report-settings" />;
export const CustomRulesManager = () => <Placeholder label="custom-rules-manager" />;
