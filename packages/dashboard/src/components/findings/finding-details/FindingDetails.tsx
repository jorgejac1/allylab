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
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 520,
        background: '#fff',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideIn 0.2s ease-out',
      }}
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
      <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0, paddingRight: 40, lineHeight: 1.3 }}>
            {finding.ruleTitle}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'none',
              border: 'none',
              fontSize: 28,
              cursor: 'pointer',
              color: '#94a3b8',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
          {finding.description}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => copyToClipboard(finding.selector, 'selector')}
            style={copiedSelector ? { animation: 'fadeSuccess 2s ease-out' } : undefined}
            onAnimationEnd={() => handleCopyAnimationEnd('selector')}
          >
            {copiedSelector ? (
              <>
                <Check size={14} aria-hidden="true" style={{ marginRight: 6 }} />
                Copied!
              </>
            ) : (
              <>
                <Clipboard size={14} aria-hidden="true" style={{ marginRight: 6 }} />
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
                  <Check size={14} aria-hidden="true" style={{ marginRight: 6 }} />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard size={14} aria-hidden="true" style={{ marginRight: 6 }} />
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
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Impact Level */}
        <Section title="IMPACT LEVEL">
          <SeverityBadge severity={finding.impact} />
          <StatusBadge status={finding.status} />
        </Section>

        {/* Fix Difficulty */}
        <Section title="FIX DIFFICULTY">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: difficulty.color,
                }}
              />
              <span style={{ fontWeight: 600, color: difficulty.color }}>
                {difficulty.label}
              </span>
              <span style={{ color: '#64748b' }}>≈ {difficulty.time}</span>
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              ~5,000 users affected
            </span>
          </div>
        </Section>

        {/* WCAG Compliance */}
        {finding.wcagTags.length > 0 && (
          <Section title="WCAG COMPLIANCE">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {finding.wcagTags.map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: '6px 12px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* CSS Selector */}
        <Section title="CSS SELECTOR">
          <code
            style={{
              display: 'block',
              padding: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              color: '#374151',
              wordBreak: 'break-all',
              fontFamily: 'Monaco, Consolas, monospace',
              width: '100%',
            }}
          >
            {finding.selector}
          </code>
        </Section>

        {/* Visual Location Placeholder */}
        <Section title="VISUAL LOCATION">
          <div
            style={{
              padding: 32,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              textAlign: 'center',
              width: '100%',
            }}
          >
            <div style={{ color: '#94a3b8', display: 'flex', justifyContent: 'center' }}>
              <Image size={24} aria-hidden="true" />
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
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
              style={{
                background: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 12,
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              {showContext ? 'Hide Context' : 'Show Context'}
            </button>
          }
        >
          <pre
            style={{
              padding: 16,
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: 8,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: showContext ? 300 : 100,
              margin: 0,
              fontFamily: 'Monaco, Consolas, monospace',
              transition: 'max-height 0.2s ease',
              width: '100%',
            }}
          >
            {finding.html}
          </pre>
        </Section>

        {/* Suggested Fix */}
        {finding.fixSuggestion && (
          <Section title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={14} aria-hidden="true" />SUGGESTED FIX</span>}>
            <div style={{ width: '100%' }}>
              <pre
                style={{
                  padding: 16,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  borderRadius: 8,
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 150,
                  margin: 0,
                  fontFamily: 'Monaco, Consolas, monospace',
                }}
              >
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
                    <Check size={14} aria-hidden="true" style={{ marginRight: 6 }} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard size={14} aria-hidden="true" style={{ marginRight: 6 }} />
                    Copy Fix
                  </>
                )}
              </Button>
            </div>
          </Section>
        )}

        {/* AI-Powered Suggestions */}
        <Section
          title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Bot size={14} aria-hidden="true" />AI-POWERED SUGGESTIONS</span>}
          subtitle="Powered by Claude AI"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: '#eff6ff',
              color: '#2563eb',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <BookOpen size={16} aria-hidden="true" />WCAG Documentation →
          </a>
        </Section>

        {/* Tracking History */}
        {(finding.firstSeen || finding.lastSeen) && (
          <Section title="TRACKING HISTORY">
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.8 }}>
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
      <div
        style={{
          padding: 20,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: 12,
        }}
      >
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
                <Loader2 size={14} aria-hidden="true" style={{ marginRight: 6, animation: 'spin 1s linear infinite' }} />
                Generating...
              </>
            ) : (
              <>
                <Bot size={14} aria-hidden="true" style={{ marginRight: 6 }} />
                Generate AI Fix
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
