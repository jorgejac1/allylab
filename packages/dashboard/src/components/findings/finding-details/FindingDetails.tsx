import { useState } from 'react';
import { Button, SeverityBadge, StatusBadge } from '../../ui';
import { Clipboard, Check, Image, Lightbulb, Bot, BookOpen, Loader2 } from 'lucide-react';
import { FIX_DIFFICULTY } from './constants';
import { Section } from './Section';
import { AISuggestion } from './AISuggestion';
import type { FindingDetailsProps } from './types';

export function FindingDetails({
  finding,
  similarCount = 0,
  onClose,
  onGenerateFix,
  isGeneratingFix = false
}: FindingDetailsProps) {
  const [showContext, setShowContext] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);

  const difficulty = FIX_DIFFICULTY[finding.impact];

  const copyToClipboard = (text: string, type: 'selector' | 'fix') => {
    navigator.clipboard.writeText(text);
    if (type === 'selector') {
      setCopiedSelector(true);
    } else {
      setCopiedFix(true);
    }
  };

  const handleCopyAnimationEnd = (type: 'selector' | 'fix') => {
    if (type === 'selector') {
      setCopiedSelector(false);
    } else {
      setCopiedFix(false);
    }
  };

  return (
    <div
      className="fixed top-0 right-0 bottom-0 w-[520px] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.15)] z-[1000] flex flex-col overflow-hidden"
      style={{ animation: 'slideIn 0.2s ease-out' }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeSuccess {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold m-0 pr-10 leading-tight">
            {finding.ruleTitle}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="absolute top-5 right-5 bg-none border-none text-[28px] cursor-pointer text-slate-400 leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-slate-500 m-0 mb-4 leading-normal">
          {finding.description}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => copyToClipboard(finding.selector, 'selector')}
            style={copiedSelector ? { animation: 'fadeSuccess 2s ease-out' } : undefined}
            onAnimationEnd={() => handleCopyAnimationEnd('selector')}
          >
            {copiedSelector ? (
              <>
                <Check size={14} aria-hidden="true" className="mr-1.5" />
                Copied!
              </>
            ) : (
              <>
                <Clipboard size={14} aria-hidden="true" className="mr-1.5" />
                Copy Selector
              </>
            )}
          </Button>
          {finding.fixSuggestion && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => copyToClipboard(finding.fixSuggestion!, 'fix')}
              style={copiedFix ? { animation: 'fadeSuccess 2s ease-out' } : undefined}
              onAnimationEnd={() => handleCopyAnimationEnd('fix')}
            >
              {copiedFix ? (
                <>
                  <Check size={14} aria-hidden="true" className="mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard size={14} aria-hidden="true" className="mr-1.5" />
                  Copy Fix
                </>
              )}
            </Button>
          )}
          {similarCount > 0 && (
            <Button variant="secondary" size="sm">
              +{similarCount} similar issues
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Impact Level */}
        <Section title="IMPACT LEVEL">
          <SeverityBadge severity={finding.impact} />
          <StatusBadge status={finding.status} />
        </Section>

        {/* Fix Difficulty */}
        <Section title="FIX DIFFICULTY">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="w-3 h-3 rounded-full"
                style={{ background: difficulty.color }}
              />
              <span className="font-semibold" style={{ color: difficulty.color }}>
                {difficulty.label}
              </span>
              <span className="text-slate-500">≈ {difficulty.time}</span>
            </div>
            <span className="text-[13px] text-slate-500">
              ~5,000 users affected
            </span>
          </div>
        </Section>

        {/* WCAG Compliance */}
        {finding.wcagTags.length > 0 && (
          <Section title="WCAG COMPLIANCE">
            <div className="flex gap-2 flex-wrap">
              {finding.wcagTags.map(tag => (
                <span
                  key={tag}
                  className="py-1.5 px-3 bg-blue-50 text-blue-600 rounded-md text-[13px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* CSS Selector */}
        <Section title="CSS SELECTOR">
          <code className="block p-4 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-gray-700 break-all font-mono w-full">
            {finding.selector}
          </code>
        </Section>

        {/* Visual Location Placeholder */}
        <Section title="VISUAL LOCATION">
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg text-center w-full">
            <div className="text-slate-400 flex justify-center">
              <Image size={24} aria-hidden="true" />
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Screenshot preview
            </div>
          </div>
        </Section>

        {/* Current HTML */}
        <Section
          title="CURRENT HTML"
          action={
            <button
              onClick={() => setShowContext(!showContext)}
              className="bg-none border border-slate-200 rounded-md py-1 px-3 text-xs text-slate-500 cursor-pointer"
            >
              {showContext ? 'Hide Context' : 'Show Context'}
            </button>
          }
        >
          <pre
            className="p-4 bg-slate-800 text-slate-200 rounded-lg text-xs overflow-auto m-0 font-mono w-full transition-[max-height] duration-200 ease-in-out"
            style={{ maxHeight: showContext ? 300 : 100 }}
          >
            {finding.html}
          </pre>
        </Section>

        {/* Suggested Fix */}
        {finding.fixSuggestion && (
          <Section title={<span className="flex items-center gap-1.5"><Lightbulb size={14} aria-hidden="true" />SUGGESTED FIX</span>}>
            <div className="w-full">
              <pre className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs overflow-auto max-h-[150px] m-0 font-mono">
                {finding.fixSuggestion}
              </pre>
              <Button
                variant="primary"
                size="sm"
                style={copiedFix ? { marginTop: 12, animation: 'fadeSuccess 2s ease-out' } : { marginTop: 12 }}
                onClick={() => copyToClipboard(finding.fixSuggestion!, 'fix')}
                onAnimationEnd={() => handleCopyAnimationEnd('fix')}
              >
                {copiedFix ? (
                  <>
                    <Check size={14} aria-hidden="true" className="mr-1.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard size={14} aria-hidden="true" className="mr-1.5" />
                    Copy Fix
                  </>
                )}
              </Button>
            </div>
          </Section>
        )}

        {/* AI-Powered Suggestions */}
        <Section
          title={<span className="flex items-center gap-1.5"><Bot size={14} aria-hidden="true" />AI-POWERED SUGGESTIONS</span>}
          subtitle="Powered by Claude AI"
        >
          <div className="flex flex-col gap-3 w-full">
            <AISuggestion
              rank={1}
              type="RECOMMENDED"
              color="#2563eb"
              text="Element does not have an alt attribute"
            />
            <AISuggestion
              rank={2}
              type="ALTERNATIVE"
              color="#10b981"
              text="aria-label attribute does not exist or is empty"
            />
            <AISuggestion
              rank={3}
              type="ADVANCED"
              color="#f59e0b"
              text="aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty"
            />
            <AISuggestion
              rank={4}
              type="ADVANCED"
              color="#f59e0b"
              text="Element has no title attribute"
            />
            <AISuggestion
              rank={5}
              type="ADVANCED"
              color="#f59e0b"
              text='Elements default semantics were not overridden with role="none" or role="presentation"'
            />
          </div>
        </Section>

        {/* Learn More */}
        <Section title="LEARN MORE">
          <a
            href={finding.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-3 px-5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold no-underline"
          >
            <BookOpen size={16} aria-hidden="true" />WCAG Documentation →
          </a>
        </Section>

        {/* Tracking History */}
        {(finding.firstSeen || finding.lastSeen) && (
          <Section title="TRACKING HISTORY">
            <div className="text-[13px] text-slate-500 leading-relaxed">
              {finding.firstSeen && (
                <div>
                  <strong>First seen:</strong> {new Date(finding.firstSeen).toLocaleString()}
                </div>
              )}
              {finding.lastSeen && (
                <div>
                  <strong>Last seen:</strong> {new Date(finding.lastSeen).toLocaleString()}
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-200 flex gap-3">
        <Button variant="secondary" style={{ flex: 1 }} onClick={onClose}>
          Close
        </Button>
        {onGenerateFix && !finding.fixSuggestion && (
          <Button
            style={{ flex: 1 }}
            onClick={() => onGenerateFix(finding)}
            disabled={isGeneratingFix}
          >
            {isGeneratingFix ? (
              <>
                <Loader2 size={14} aria-hidden="true" className="mr-1.5" style={{ animation: 'spin 1s linear infinite' }} />
                Generating...
              </>
            ) : (
              <>
                <Bot size={14} aria-hidden="true" className="mr-1.5" />
                Generate AI Fix
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
