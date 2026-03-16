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
        className="fixed inset-0 bg-black/30 z-[999]"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 w-[600px] max-w-[100vw] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.1)] z-[1000] flex flex-col"
        style={{ animation: 'slideIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-lg font-semibold m-0 mb-2">
                {finding.ruleTitle}
              </h2>
              <p className="text-sm text-slate-500 m-0">
                {finding.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-none border-none cursor-pointer text-slate-500 p-1 flex items-center"
            >
              <X size={24} />
            </button>
          </div>

          {/* False Positive Banner */}
          {finding.falsePositive && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-900 font-medium">
                <Ban size={16} />
                Marked as False Positive
              </div>
              {finding.falsePositiveReason && (
                <div className="mt-2 text-[13px] text-slate-500">
                  Reason: {finding.falsePositiveReason}
                </div>
              )}
              {finding.falsePositiveMarkedAt && (
                <div className="mt-1 text-xs text-slate-400">
                  Marked on{" "}
                  {new Date(finding.falsePositiveMarkedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {/* Status Badges */}
          <div className="flex gap-2 mb-5">
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
            <div className="flex gap-2 flex-wrap">
              {finding.wcagTags.length > 0 ? (
                finding.wcagTags.map((tag) => (
                  <span
                    key={tag}
                    className="py-1 px-2.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-[13px]">
                  No WCAG tags
                </span>
              )}
            </div>
          </Section>

          {/* Selector */}
          <Section title="CSS Selector">
            <div className="relative">
              <code className="block p-3 bg-slate-800 text-slate-200 rounded-lg text-xs break-all">
                {finding.selector}
              </code>
              <button
                onClick={() => handleCopy(finding.selector, "selector")}
                className="absolute top-2 right-2 py-1 px-2 bg-slate-700 border-none rounded text-white text-[11px] cursor-pointer flex items-center gap-1"
              >
                {copiedSelector ? <><Check size={12} />Copied!</> : "Copy"}
              </button>
            </div>
          </Section>

          {/* HTML */}
          <Section title="HTML Element">
            <div className="relative">
              <pre className="p-3 bg-slate-800 text-slate-200 rounded-lg text-[11px] overflow-auto max-h-[200px] m-0">
                {finding.html}
              </pre>
              <button
                onClick={() => handleCopy(finding.html, "html")}
                className="absolute top-2 right-2 py-1 px-2 bg-slate-700 border-none rounded text-white text-[11px] cursor-pointer flex items-center gap-1"
              >
                {copiedHtml ? <><Check size={12} />Copied!</> : "Copy"}
              </button>
            </div>
          </Section>

          {/* AI Fix Section */}
          <Section title={<><Wrench size={14} className="mr-1.5" />AI-Powered Fix</>}>
            {codeFix ? (
              <div className="flex flex-col gap-3">
                <FixCodePreview fix={codeFix} />

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowApplyFixModal(true)}
                  >
                    <Wrench size={14} className="mr-1.5" />
                    Apply Fix
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateEnhancedFix}
                  >
                    <RefreshCw size={14} className="mr-1.5" />
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {fixError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px] mb-3">
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
                          className="mr-2"
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        Generating Fix...
                      </>
                    ) : (
                      <><Sparkles size={14} className="mr-1.5" />Generate AI Fix</>
                    )}
                  </Button>
                )}

                <p className="text-xs text-slate-500 mt-2">
                  Powered by Claude AI - Generates framework-specific code fixes
                </p>
              </div>
            )}
          </Section>

          {/* Legacy Fix Suggestion (if exists from old data) */}
          {finding.fixSuggestion && !codeFix && (
            <Section title="Previous Fix Suggestion">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-600 whitespace-pre-wrap">
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
                className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 text-sm resize-y mb-3"
              />
              <div className="flex gap-2">
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
              className="inline-flex items-center gap-2 py-2.5 px-4 bg-blue-50 text-blue-600 rounded-lg no-underline text-sm font-medium"
            >
              <BookOpen size={16} />
              WCAG Documentation →
            </a>
          </Section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex gap-3 justify-end">
          {finding.falsePositive ? (
            <Button variant="secondary" onClick={handleUnmarkFalsePositive}>
              <Check size={14} className="mr-1.5" />
              Restore Issue
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowFpForm(!showFpForm)}
            >
              <Ban size={14} className="mr-1.5" />
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
