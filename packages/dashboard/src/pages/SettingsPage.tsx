import { useState } from "react";
import { PageContainer } from "../components/layout";
import { Card, Button, Input, Select, Tabs } from "../components/ui";
import {
  CICDGenerator,
  JiraSettings,
  ScheduleManager,
  WebhookManager,
} from "../components/settings";
import { useLocalStorage } from "../hooks";
import type { WCAGStandard } from "../types";

interface Settings {
  defaultStandard: WCAGStandard;
  includeWarnings: boolean;
  autoSave: boolean;
  maxScansStored: number;
}

const DEFAULT_SETTINGS: Settings = {
  defaultStandard: "wcag21aa",
  includeWarnings: false,
  autoSave: true,
  maxScansStored: 100,
};

type TabId = "general" | "schedules" | "webhooks" | "jira" | "cicd" | "api";

const TABS = [
  { id: "general", label: "General" },
  { id: "schedules", label: "Scheduled Scans" },
  { id: "webhooks", label: "Webhooks" },
  { id: "jira", label: "JIRA Integration" },
  { id: "cicd", label: "CI/CD Integration" },
  { id: "api", label: "API" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [settings, setSettings] = useLocalStorage<Settings>(
    "allylab_settings",
    DEFAULT_SETTINGS
  );
  const [saved, setSaved] = useState(false);

  const handleChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaved(false);
  };

  const handleClearData = () => {
    if (
      confirm(
        "Are you sure you want to clear all scan data? This cannot be undone."
      )
    ) {
      localStorage.removeItem("allylab_scans");
      localStorage.removeItem("allylab_tracked_issues");
      window.location.reload();
    }
  };

  return (
    <PageContainer
      title="Settings"
      subtitle="Configure your AllyLab preferences"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Tabs */}
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {/* General Settings */}
        {activeTab === "general" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* Scanning Settings */}
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
                🔍 Scanning Preferences
              </h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <SettingRow label="Default WCAG Standard">
                  <Select
                    value={settings.defaultStandard}
                    onChange={(e) =>
                      handleChange(
                        "defaultStandard",
                        e.target.value as WCAGStandard
                      )
                    }
                    options={[
                      { value: "wcag21aa", label: "WCAG 2.1 AA (Recommended)" },
                      { value: "wcag22aa", label: "WCAG 2.2 AA" },
                      { value: "wcag21a", label: "WCAG 2.1 A" },
                      { value: "wcag2aa", label: "WCAG 2.0 AA" },
                      { value: "wcag2a", label: "WCAG 2.0 A" },
                    ]}
                    style={{ width: 250 }}
                  />
                </SettingRow>

                <SettingRow label="Include Warnings">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.includeWarnings}
                      onChange={(e) =>
                        handleChange("includeWarnings", e.target.checked)
                      }
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14, color: "#64748b" }}>
                      Show potential issues that need manual review
                    </span>
                  </label>
                </SettingRow>
              </div>
            </Card>

            {/* Storage Settings */}
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
                💾 Storage Settings
              </h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <SettingRow label="Auto-save Scans">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) =>
                        handleChange("autoSave", e.target.checked)
                      }
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14, color: "#64748b" }}>
                      Automatically save scan results to history
                    </span>
                  </label>
                </SettingRow>

                <SettingRow label="Max Scans Stored">
                  <Input
                    type="number"
                    value={settings.maxScansStored}
                    onChange={(e) =>
                      handleChange(
                        "maxScansStored",
                        parseInt(e.target.value) || 100
                      )
                    }
                    min={10}
                    max={500}
                    style={{ width: 100 }}
                  />
                </SettingRow>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card style={{ borderColor: "#fecaca" }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: "0 0 16px",
                  color: "#dc2626",
                }}
              >
                ⚠️ Danger Zone
              </h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                  Clear all stored scan data and issue tracking history. This
                  action cannot be undone.
                </p>
                <Button variant="danger" onClick={handleClearData}>
                  🗑️ Clear All Data
                </Button>
              </div>
            </Card>

            {/* Actions */}
            <div
              style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
            >
              <Button variant="secondary" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button onClick={handleSave}>
                {saved ? "✓ Saved!" : "Save Settings"}
              </Button>
            </div>
          </div>
        )}

        {/* Scheduled Scans */}
        {activeTab === "schedules" && <ScheduleManager />}

        {/* Webhooks */}
        {activeTab === "webhooks" && <WebhookManager />}

        {/* JIRA Integration */}
        {activeTab === "jira" && <JiraSettings />}

        {/* CI/CD Integration */}
        {activeTab === "cicd" && <CICDGenerator />}

        {/* API Settings */}
        {activeTab === "api" && <APISettings />}
      </div>
    </PageContainer>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}

function APISettings() {
  const [apiUrl, setApiUrl] = useLocalStorage(
    "allylab_api_url",
    "http://localhost:3001"
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* API Endpoint */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
          🔌 API Configuration
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              API Base URL
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3001"
                style={{ flex: 1 }}
              />
              <Button
                variant="secondary"
                onClick={() => setApiUrl("http://localhost:3001")}
              >
                Reset
              </Button>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              The URL where your AllyLab API is running
            </p>
          </div>
        </div>
      </Card>

      {/* API Endpoints Reference */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
          📚 API Endpoints
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <EndpointRow
            method="GET"
            path="/health"
            description="Health check endpoint"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/scan"
            description="Start an accessibility scan (SSE)"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/scan/json"
            description="Start scan and return JSON result"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="GET"
            path="/webhooks"
            description="List all webhooks"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/webhooks"
            description="Create a new webhook"
            onCopy={handleCopy}
          />
        </div>

        {copied && (
          <p style={{ fontSize: 12, color: "#10b981", marginTop: 12 }}>
            ✓ Copied to clipboard!
          </p>
        )}
      </Card>

      {/* Example Request */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>
          💡 Example Request
        </h3>

        <div
          style={{
            background: "#1e293b",
            color: "#e2e8f0",
            padding: 16,
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: 1.6,
            overflow: "auto",
          }}
        >
          <pre style={{ margin: 0 }}>
            {`curl -X POST ${apiUrl}/scan/json \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "standard": "wcag21aa",
    "viewport": "desktop"
  }'`}
          </pre>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            handleCopy(
              `curl -X POST ${apiUrl}/scan/json -H "Content-Type: application/json" -d '{"url": "https://example.com", "standard": "wcag21aa", "viewport": "desktop"}'`
            )
          }
          style={{ marginTop: 12 }}
        >
          📋 Copy cURL
        </Button>
      </Card>
    </div>
  );
}

function EndpointRow({
  method,
  path,
  description,
  onCopy,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  onCopy: (text: string) => void;
}) {
  const methodColors: Record<string, string> = {
    GET: "#10b981",
    POST: "#3b82f6",
    PUT: "#f59e0b",
    DELETE: "#ef4444",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: "#f8fafc",
        borderRadius: 6,
      }}
    >
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          background: `${methodColors[method]}20`,
          color: methodColors[method],
          fontFamily: "monospace",
        }}
      >
        {method}
      </span>
      <code style={{ flex: 1, fontSize: 13, color: "#334155" }}>{path}</code>
      <span style={{ fontSize: 13, color: "#64748b" }}>{description}</span>
      <button
        onClick={() => onCopy(path)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: "#64748b",
        }}
        title="Copy path"
      >
        📋
      </button>
    </div>
  );
}