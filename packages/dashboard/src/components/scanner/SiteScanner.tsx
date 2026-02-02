import { useState } from "react";
import { Card, Button, Input, Select } from "../ui";
import { useSiteScan, type PageResult } from "../../hooks/useSiteScan";
import { Globe, Rocket, Search, BarChart3, XCircle } from "lucide-react";
import { getScoreColor } from "../../utils/scoreUtils";

export function SiteScanner() {
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(10);
  const [maxDepth, setMaxDepth] = useState(2);
  const [standard, setStandard] = useState("wcag21aa");

  const {
    phase,
    discoveredUrls,
    currentPage,
    totalPages,
    results,
    summary,
    error,
    startScan,
    reset,
    isScanning,
  } = useSiteScan();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isScanning) return;
    startScan(url.trim(), maxPages, maxDepth, standard);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Scan Form */}
      <Card>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <Globe size={20} />Multi-Page Site Scan
        </h3>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
          Crawl and scan multiple pages across your website for accessibility
          issues.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Website URL</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isScanning}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Max Pages</label>
                <Select
                  value={maxPages.toString()}
                  onChange={(e) => setMaxPages(parseInt(e.target.value))}
                  disabled={isScanning}
                  options={[
                    { value: "5", label: "5 pages" },
                    { value: "10", label: "10 pages" },
                    { value: "25", label: "25 pages" },
                    { value: "50", label: "50 pages" },
                  ]}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Max Depth</label>
                <Select
                  value={maxDepth.toString()}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  disabled={isScanning}
                  options={[
                    { value: "1", label: "1 level" },
                    { value: "2", label: "2 levels" },
                    { value: "3", label: "3 levels" },
                  ]}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Standard</label>
                <Select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  disabled={isScanning}
                  options={[
                    { value: "wcag21aa", label: "WCAG 2.1 AA" },
                    { value: "wcag22aa", label: "WCAG 2.2 AA" },
                    { value: "wcag21a", label: "WCAG 2.1 A" },
                  ]}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Button type="submit" disabled={!url.trim() || isScanning}>
                {isScanning ? "Scanning..." : <><Rocket size={14} style={{ marginRight: 6 }} />Start Site Scan</>}
              </Button>
              {(phase === "complete" || phase === "error") && (
                <Button variant="secondary" onClick={reset}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Progress */}
      {isScanning && (
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            {phase === "crawling"
              ? <><Search size={18} />Discovering Pages...</>
              : <><BarChart3 size={18} />Scanning Pages...</>}
          </h3>

          {phase === "crawling" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={spinnerStyle} />
              <span style={{ color: "#64748b" }}>
                Found {discoveredUrls.length} pages so far...
              </span>
            </div>
          )}

          {phase === "scanning" && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    Scanning page {currentPage} of {totalPages}
                  </span>
                  <span style={{ fontSize: 14, color: "#64748b" }}>
                    {Math.round((currentPage / totalPages) * 100)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "#e2e8f0",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(currentPage / totalPages) * 100}%`,
                      background: "#3b82f6",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>

              {/* Live Results - USING PageResult */}
              <div style={{ maxHeight: 200, overflow: "auto" }}>
                {results.map((result: PageResult, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: 13,
                    }}
                  >
                    <ScoreBadge score={result.score} />
                    <span style={{ flex: 1, color: "#334155" }}>
                      {new URL(result.url).pathname || "/"}
                    </span>
                    <span style={{ color: "#64748b" }}>
                      {result.totalIssues} issues
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Error */}
      {phase === "error" && error && (
        <Card style={{ borderColor: "#fecaca", background: "#fef2f2" }}>
          <p style={{ margin: 0, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}><XCircle size={16} />{error}</p>
        </Card>
      )}

      {/* Results */}
      {phase === "complete" && summary && (
        <>
          {/* Summary */}
          <Card>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={20} />Site Scan Results
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
              }}
            >
              <SummaryCard
                label="Average Score"
                value={summary.averageScore}
                color={getScoreColor(summary.averageScore)}
                large
              />
              <SummaryCard
                label="Pages Scanned"
                value={summary.pagesScanned}
                color="#3b82f6"
              />
              <SummaryCard
                label="Total Issues"
                value={summary.totalIssues}
                color="#f59e0b"
              />
              <SummaryCard
                label="Critical"
                value={summary.critical}
                color="#dc2626"
              />
            </div>
          </Card>

          {/* Page Results Table - USING PageResult */}
          <Card>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
              Page-by-Page Results
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Page</th>
                    <th style={thStyle}>Score</th>
                    <th style={thStyle}>Critical</th>
                    <th style={thStyle}>Serious</th>
                    <th style={thStyle}>Moderate</th>
                    <th style={thStyle}>Minor</th>
                    <th style={thStyle}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.results
                    .sort((a: PageResult, b: PageResult) => a.score - b.score)
                    .map((result: PageResult, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#3b82f6", textDecoration: "none" }}
                          >
                            {new URL(result.url).pathname || "/"}
                          </a>
                        </td>
                        <td style={tdStyle}>
                          <ScoreBadge score={result.score} />
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color: result.critical > 0 ? "#dc2626" : "#94a3b8",
                          }}
                        >
                          {result.critical}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color: result.serious > 0 ? "#f97316" : "#94a3b8",
                          }}
                        >
                          {result.serious}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color: result.moderate > 0 ? "#eab308" : "#94a3b8",
                          }}
                        >
                          {result.moderate}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color: result.minor > 0 ? "#3b82f6" : "#94a3b8",
                          }}
                        >
                          {result.minor}
                        </td>
                        <td style={tdStyle}>{result.totalIssues}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: `${getScoreColor(score)}20`,
        color: getScoreColor(score),
      }}
    >
      {score}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  color,
  large = false,
}: {
  label: string;
  value: number;
  color: string;
  large?: boolean;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: `${color}10`,
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: large ? 32 : 24, fontWeight: 700, color }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#475569",
  marginBottom: 6,
};

const spinnerStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  border: "2px solid #e2e8f0",
  borderTopColor: "#3b82f6",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 14,
};
