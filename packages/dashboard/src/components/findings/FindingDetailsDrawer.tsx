import { Button, SeverityBadge, StatusBadge, Section } from "../ui";
import { FixCodePreview } from "./FixCodePreview";
import { ApplyFixModal } from "./ApplyFixModal";
import { ElementScreenshot } from "./ElementScreenshot";
import { useDrawerState } from "../../hooks";
import type { TrackedFinding } from "../../types";
import {
  X,
  Ban,
  Check,
  Wrench,
  RefreshCw,
  Settings,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface FindingDetailsDrawerProps {
  isOpen: boolean;
  finding: TrackedFinding | null;
  onClose: () => void;
  onFalsePositiveChange?: () => void;
  scanUrl?: string;
}

export function FindingDetailsDrawer({
  isOpen,
  finding,
  onClose,
  onFalsePositiveChange,
  scanUrl,
}: FindingDetailsDrawerProps) {
  const {
    showFpForm,
    fpReason,
    copiedSelector,
    copiedHtml,
    isGeneratingFix,
    codeFix,
    fixError,
    showApplyFixModal,
    setShowFpForm,
    setFpReason,
    handleMarkFalsePositive,
    handleUnmarkFalsePositive,
    handleCopy,
    handleGenerateEnhancedFix,
    setShowApplyFixModal,
  } = useDrawerState({ finding, onFalsePositiveChange, onClose });

  if (!isOpen || !finding) return null;

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
                cursor: "pointer",
                color: "#64748b",
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={24} />
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
                <Ban size={16} />
                Marked as False Positive
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

          {/* Element Screenshot */}
          <Section title="Element Preview">
            <ElementScreenshot
              screenshot={finding.screenshot}
              selector={finding.selector}
            />
          </Section>

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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copiedSelector ? <><Check size={12} />Copied!</> : "Copy"}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copiedHtml ? <><Check size={12} />Copied!</> : "Copy"}
              </button>
            </div>
          </Section>

          {/* AI Fix Section */}
          <Section title={<><Wrench size={14} style={{ marginRight: 6 }} />AI-Powered Fix</>}>
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
                    onClick={() => setShowApplyFixModal(true)}
                  >
                    <Wrench size={14} style={{ marginRight: 6 }} />
                    Apply Fix
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateEnhancedFix}
                  >
                    <RefreshCw size={14} style={{ marginRight: 6 }} />
                    Regenerate
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
                        <Settings
                          size={14}
                          style={{
                            marginRight: 8,
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Generating Fix...
                      </>
                    ) : (
                      <><Sparkles size={14} style={{ marginRight: 6 }} />Generate AI Fix</>
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
              <BookOpen size={16} />
              WCAG Documentation →
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
              <Check size={14} style={{ marginRight: 6 }} />
              Restore Issue
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowFpForm(!showFpForm)}
            >
              <Ban size={14} style={{ marginRight: 6 }} />
              Mark as False Positive
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      {/* Apply Fix Modal */}
      {codeFix && (
        <ApplyFixModal
          isOpen={showApplyFixModal}
          onClose={() => setShowApplyFixModal(false)}
          fix={codeFix}
          finding={{
            id: finding.id,
            ruleTitle: finding.ruleTitle,
            selector: finding.selector,
          }}
          scanUrl={scanUrl || ''}
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