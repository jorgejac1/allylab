import { useState } from "react";
import { Button, SeverityBadge, StatusBadge } from "../ui";
import { FixCodePreview } from "./FixCodePreview";
import { CreatePRModal } from "./CreatePRModal";
import type { TrackedFinding } from "../../types";
import type { CodeFix } from "../../types/fixes";
import {
  markAsFalsePositive,
  unmarkFalsePositive,
} from "../../utils/falsePositives";
import { getApiBase } from "../../utils/api";

interface FindingDetailsDrawerProps {
  isOpen: boolean;
  finding: TrackedFinding | null;
  onClose: () => void;
  onFalsePositiveChange?: () => void;
  onGenerateFix?: (finding: TrackedFinding) => Promise<void>;
  isGeneratingFix?: boolean;
  // Scan settings for PR tracking
  scanUrl?: string;
  scanStandard?: string;
  scanViewport?: string;
}

export function FindingDetailsDrawer({
  isOpen,
  finding,
  onClose,
  onFalsePositiveChange,
  scanUrl,
  scanStandard,
  scanViewport,
}: FindingDetailsDrawerProps) {
  const [showFpForm, setShowFpForm] = useState(false);
  const [fpReason, setFpReason] = useState("");
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // AI Fix state
  const [isGeneratingFix, setIsGeneratingFix] = useState(false);
  const [codeFix, setCodeFix] = useState<CodeFix | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);

  // PR Modal state
  const [showPRModal, setShowPRModal] = useState(false);

  if (!isOpen || !finding) return null;

  const handleCopy = async (text: string, type: "selector" | "html") => {
    await navigator.clipboard.writeText(text);
    if (type === "selector") {
      setCopiedSelector(true);
      setTimeout(() => setCopiedSelector(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const handleMarkFalsePositive = () => {
    markAsFalsePositive(
      finding.fingerprint,
      finding.ruleId,
      fpReason || undefined
    );
    setShowFpForm(false);
    setFpReason("");
    onFalsePositiveChange?.();
    onClose();
  };

  const handleUnmarkFalsePositive = () => {
    unmarkFalsePositive(finding.fingerprint);
    onFalsePositiveChange?.();
    onClose();
  };

  const handleGenerateEnhancedFix = async () => {
    setIsGeneratingFix(true);
    setFixError(null);
    setCodeFix(null);

    try {
      const response = await fetch(`${getApiBase()}/fixes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finding: {
            ruleId: finding.ruleId,
            ruleTitle: finding.ruleTitle,
            description: finding.description,
            html: finding.html,
            selector: finding.selector,
            wcagTags: finding.wcagTags,
            impact: finding.impact,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.fix) {
        setCodeFix(data.fix);
      } else {
        const errorMessage = data.error || "Failed to generate fix";
        console.error(
          "[FindingDetailsDrawer] Fix generation failed:",
          errorMessage
        );
        setFixError(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      console.error(
        "[FindingDetailsDrawer] Failed to connect to AI service:",
        message
      );
      setFixError("Failed to connect to AI service");
    } finally {
      setIsGeneratingFix(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 999,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 600,
          maxWidth: "100vw",
          background: "#fff",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          animation: "slideIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                {finding.ruleTitle}
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                {finding.description}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#64748b",
                padding: 4,
              }}
            >
              ×
            </button>
          </div>

          {/* False Positive Banner */}
          {finding.falsePositive && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "#fef2f2",
                borderRadius: 8,
                border: "1px solid #fecaca",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#991b1b",
                  fontWeight: 500,
                }}
              >
                🚫 Marked as False Positive
              </div>
              {finding.falsePositiveReason && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
                  Reason: {finding.falsePositiveReason}
                </div>
              )}
              {finding.falsePositiveMarkedAt && (
                <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
                  Marked on{" "}
                  {new Date(finding.falsePositiveMarkedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {/* Status Badges */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <SeverityBadge severity={finding.impact} />
            <StatusBadge status={finding.status} />
          </div>

          {/* WCAG Tags */}
          <Section title="WCAG Compliance">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {finding.wcagTags.length > 0 ? (
                finding.wcagTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "4px 10px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span style={{ color: "#64748b", fontSize: 13 }}>
                  No WCAG tags
                </span>
              )}
            </div>
          </Section>

          {/* Selector */}
          <Section title="CSS Selector">
            <div style={{ position: "relative" }}>
              <code
                style={{
                  display: "block",
                  padding: 12,
                  background: "#1e293b",
                  color: "#e2e8f0",
                  borderRadius: 8,
                  fontSize: 12,
                  wordBreak: "break-all",
                }}
              >
                {finding.selector}
              </code>
              <button
                onClick={() => handleCopy(finding.selector, "selector")}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  padding: "4px 8px",
                  background: "#334155",
                  border: "none",
                  borderRadius: 4,
                  color: "#fff",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {copiedSelector ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </Section>

          {/* HTML */}
          <Section title="HTML Element">
            <div style={{ position: "relative" }}>
              <pre
                style={{
                  padding: 12,
                  background: "#1e293b",
                  color: "#e2e8f0",
                  borderRadius: 8,
                  fontSize: 11,
                  overflow: "auto",
                  maxHeight: 200,
                  margin: 0,
                }}
              >
                {finding.html}
              </pre>
              <button
                onClick={() => handleCopy(finding.html, "html")}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  padding: "4px 8px",
                  background: "#334155",
                  border: "none",
                  borderRadius: 4,
                  color: "#fff",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {copiedHtml ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </Section>

          {/* AI Fix Section */}
          <Section title="🔧 AI-Powered Fix">
            {codeFix ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <FixCodePreview fix={codeFix} />

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowPRModal(true)}
                  >
                    🚀 Create PR
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateEnhancedFix}
                  >
                    🔄 Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {fixError && (
                  <div
                    style={{
                      padding: 12,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      color: "#dc2626",
                      fontSize: 13,
                      marginBottom: 12,
                    }}
                  >
                    {fixError}
                  </div>
                )}

                {!finding.falsePositive && (
                  <Button
                    onClick={handleGenerateEnhancedFix}
                    disabled={isGeneratingFix}
                    variant="primary"
                  >
                    {isGeneratingFix ? (
                      <>
                        <span
                          style={{
                            display: "inline-block",
                            animation: "spin 1s linear infinite",
                            marginRight: 8,
                          }}
                        >
                          ⚙️
                        </span>
                        Generating Fix...
                      </>
                    ) : (
                      "✨ Generate AI Fix"
                    )}
                  </Button>
                )}

                <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                  Powered by Claude AI • Generates framework-specific code fixes
                </p>
              </div>
            )}
          </Section>

          {/* Legacy Fix Suggestion (if exists from old data) */}
          {finding.fixSuggestion && !codeFix && (
            <Section title="Previous Fix Suggestion">
              <div
                style={{
                  padding: 12,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#475569",
                  whiteSpace: "pre-wrap",
                }}
              >
                {finding.fixSuggestion}
              </div>
            </Section>
          )}

          {/* False Positive Form */}
          {!finding.falsePositive && showFpForm && (
            <Section title="Mark as False Positive">
              <textarea
                placeholder="Optional: Explain why this is a false positive..."
                value={fpReason}
                onChange={(e) => setFpReason(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 14,
                  resize: "vertical",
                  marginBottom: 12,
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowFpForm(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleMarkFalsePositive}>
                  Confirm False Positive
                </Button>
              </div>
            </Section>
          )}

          {/* Learn More */}
          <Section title="Learn More">
            <a
              href={finding.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "#eff6ff",
                color: "#2563eb",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              📚 WCAG Documentation →
            </a>
          </Section>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 16,
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          {finding.falsePositive ? (
            <Button variant="secondary" onClick={handleUnmarkFalsePositive}>
              ✓ Restore Issue
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowFpForm(!showFpForm)}
            >
              🚫 Mark as False Positive
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      {/* PR Modal */}
      {codeFix && (
        <CreatePRModal
          isOpen={showPRModal}
          onClose={() => setShowPRModal(false)}
          fix={codeFix}
          finding={{
            id: finding.id,
            ruleTitle: finding.ruleTitle,
            selector: finding.selector,
          }}
          scanUrl={scanUrl || ''}
          scanStandard={scanStandard}
          scanViewport={scanViewport}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#64748b",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}