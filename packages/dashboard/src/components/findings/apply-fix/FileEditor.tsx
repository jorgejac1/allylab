import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../ui';
import { findCodeInJsx, htmlToJsx, extractAllClasses } from './utils';
import type { CodeLocation } from './utils';

interface FileEditorProps {
  filePath: string;
  fileContent: string;
  originalCode: string;
  fixedCode: string;
  isLoading: boolean;
  isCreatingPR: boolean;
  error: string | null;
  onBack: () => void;
  onCreatePR: (updatedContent: string, lineStart?: number, lineEnd?: number) => void;
}

export function FileEditor({
  filePath,
  fileContent,
  originalCode,
  fixedCode,
  isLoading,
  isCreatingPR,
  error,
  onBack,
  onCreatePR,
}: FileEditorProps) {
  const lines = useMemo(() => fileContent.split('\n'), [fileContent]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Extract text content for matching
  const textContent = useMemo(() => {
    const match = originalCode.match(/>([^<]{2,50})</);
    return match?.[1]?.trim() || null;
  }, [originalCode]);
  
  // Convert fixed HTML to JSX
  const fixedJsx = useMemo(() => htmlToJsx(fixedCode), [fixedCode]);

  // Auto-find matching lines using JSX-aware detection
  const autoMatch = useMemo(() => {
    if (!fileContent || !originalCode) return null;
    return findCodeInJsx(fileContent, originalCode, textContent);
  }, [fileContent, originalCode, textContent]);

  // Initialize selection from auto-match (lazy initialization)
  const [selectedLines, setSelectedLines] = useState<{ start: number; end: number } | null>(() => {
    if (!fileContent || !originalCode) return null;
    const match = findCodeInJsx(fileContent, originalCode, textContent);
    return match ? { start: match.lineStart, end: match.lineEnd } : null;
  });
  const [manualMode, setManualMode] = useState(false);
  const [showDiffPreview, setShowDiffPreview] = useState(true);
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState(0);

  // Generate preview of updated content (moved UP before useEffect that uses it)
  const updatedContent = useMemo(() => {
    if (!selectedLines) return fileContent;
    
    const linesBefore = lines.slice(0, selectedLines.start - 1);
    const linesAfter = lines.slice(selectedLines.end);
    
    return [...linesBefore, fixedJsx, ...linesAfter].join('\n');
  }, [lines, selectedLines, fixedJsx, fileContent]);

  // Center scroll on matched location
  useEffect(() => {
    if (autoMatch && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const lineHeight = 24;
      const containerHeight = container.clientHeight;
      
      // Calculate center position
      const matchCenter = (autoMatch.lineStart + autoMatch.lineEnd) / 2;
      const scrollTo = (matchCenter * lineHeight) - (containerHeight / 2);
      
      container.scrollTop = Math.max(0, scrollTo);
    }
  }, [autoMatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to create PR (when selection exists and not already creating)
      if (e.key === 'Enter' && !e.shiftKey && selectedLines && !isCreatingPR) {
        e.preventDefault();
        onCreatePR(updatedContent, selectedLines.start, selectedLines.end);
      }
      
      // Escape to go back
      if (e.key === 'Escape') {
        onBack();
      }
      
      // Arrow keys to navigate instances
      if (autoMatch?.allInstances && autoMatch.allInstances.length > 1) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = (currentInstanceIndex + 1) % autoMatch.allInstances.length;
          setCurrentInstanceIndex(nextIndex);
          const instance = autoMatch.allInstances[nextIndex];
          setSelectedLines({ start: instance.lineStart, end: instance.lineEnd });
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = currentInstanceIndex === 0 
            ? autoMatch.allInstances.length - 1 
            : currentInstanceIndex - 1;
          setCurrentInstanceIndex(prevIndex);
          const instance = autoMatch.allInstances[prevIndex];
          setSelectedLines({ start: instance.lineStart, end: instance.lineEnd });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLines, isCreatingPR, onCreatePR, onBack, autoMatch, currentInstanceIndex, updatedContent]);

  // Get the code being replaced
  const replacedCode = useMemo(() => {
    if (!selectedLines) return '';
    return lines.slice(selectedLines.start - 1, selectedLines.end).join('\n');
  }, [lines, selectedLines]);

  // Navigate to specific instance
  const goToInstance = useCallback((index: number) => {
    if (!autoMatch?.allInstances) return;
    const instance = autoMatch.allInstances[index];
    setCurrentInstanceIndex(index);
    setSelectedLines({ start: instance.lineStart, end: instance.lineEnd });
    
    // Scroll to instance
    if (scrollContainerRef.current) {
      const lineHeight = 24;
      const containerHeight = scrollContainerRef.current.clientHeight;
      const scrollTo = (instance.lineStart * lineHeight) - (containerHeight / 2);
      scrollContainerRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [autoMatch]);

  const handleLineClick = (lineNum: number) => {
    if (!manualMode) return;
    
    if (!selectedLines) {
      setSelectedLines({ start: lineNum, end: lineNum });
    } else if (lineNum < selectedLines.start) {
      setSelectedLines({ start: lineNum, end: selectedLines.end });
    } else if (lineNum > selectedLines.end) {
      setSelectedLines({ start: selectedLines.start, end: lineNum });
    } else {
      setSelectedLines({ start: lineNum, end: lineNum });
    }
  };

  const handleCreatePR = () => {
    onCreatePR(updatedContent, selectedLines?.start, selectedLines?.end);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>📄</div>
        Loading file content...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            📝 Edit: {filePath.split('/').pop()}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            {filePath}
          </p>
        </div>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>

      {/* Match Status */}
      <MatchStatusBanner autoMatch={autoMatch} />

      {/* Instance Navigator (if multiple instances) */}
      <InstanceNavigator 
        autoMatch={autoMatch}
        currentInstanceIndex={currentInstanceIndex}
        onGoToInstance={goToInstance}
      />

      {/* Controls Row */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <label style={{ 
          fontSize: 12, 
          color: '#64748b', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={manualMode}
            onChange={e => setManualMode(e.target.checked)}
          />
          Manual selection mode
        </label>
        
        <label style={{ 
          fontSize: 12, 
          color: '#64748b', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={showDiffPreview}
            onChange={e => setShowDiffPreview(e.target.checked)}
          />
          Show diff preview
        </label>
        
        {selectedLines && (
          <span style={{ 
            fontSize: 12, 
            color: '#475569',
            background: '#f1f5f9',
            padding: '4px 8px',
            borderRadius: 4,
          }}>
            📍 Lines {selectedLines.start}-{selectedLines.end}
          </span>
        )}
      </div>

      {/* Diff Preview (Inline) */}
      {showDiffPreview && selectedLines && (
        <DiffPreview
          originalCode={replacedCode}
          fixedCode={fixedJsx}
        />
      )}

      {/* File Content Viewer */}
      <div 
        ref={scrollContainerRef}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          maxHeight: 300,
          overflow: 'auto',
        }}
      >
        <div style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          lineHeight: 1.6,
        }}>
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isSelected = selectedLines && 
              lineNum >= selectedLines.start && 
              lineNum <= selectedLines.end;
            const isMatchStart = autoMatch && lineNum === autoMatch.lineStart;
            
            return (
              <div
                key={idx}
                onClick={() => handleLineClick(lineNum)}
                style={{
                  display: 'flex',
                  background: isSelected ? '#fef3c7' : idx % 2 === 0 ? '#fff' : '#fafafa',
                  cursor: manualMode ? 'pointer' : 'default',
                  borderLeft: isSelected ? '3px solid #f59e0b' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <span style={{
                  width: 50,
                  padding: '2px 8px',
                  textAlign: 'right',
                  color: isSelected ? '#92400e' : '#94a3b8',
                  background: isSelected ? '#fde68a' : '#f1f5f9',
                  userSelect: 'none',
                  flexShrink: 0,
                  fontWeight: isMatchStart ? 700 : 400,
                }}>
                  {lineNum}
                </span>
                <span style={{
                  padding: '2px 12px',
                  whiteSpace: 'pre',
                  overflow: 'auto',
                  flex: 1,
                  color: isSelected ? '#78350f' : '#334155',
                }}>
                  {highlightMatches(line, originalCode, textContent)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* JSX Conversion Note */}
      <div style={{
        padding: '8px 12px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 6,
        fontSize: 11,
        color: '#1e40af',
      }}>
        💡 <strong>Note:</strong> The fix has been converted to JSX format (class → className). 
        The replacement will use: <code style={{ background: '#dbeafe', padding: '1px 4px', borderRadius: 2 }}>className</code>
      </div>

      {/* Replacement Preview */}
      {selectedLines && (
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#475569',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            🔄 Lines {selectedLines.start}-{selectedLines.end} will be replaced with:
          </div>
          <pre style={{
            margin: 0,
            padding: 12,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'ui-monospace, monospace',
            overflow: 'auto',
            maxHeight: 100,
            whiteSpace: 'pre-wrap',
            color: '#166534',
          }}>
            {fixedJsx}
          </pre>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: 12,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: 8,
        borderTop: '1px solid #e2e8f0',
      }}>
        <span style={{ fontSize: 10, color: '#94a3b8', marginRight: 'auto' }}>
          <kbd style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 2, border: '1px solid #e2e8f0' }}>Enter</kbd> Create PR
          {' · '}
          <kbd style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 2, border: '1px solid #e2e8f0' }}>Esc</kbd> Back
        </span>
        <Button variant="secondary" onClick={onBack}>
          ← Back
        </Button>
        <Button
          variant="primary"
          onClick={handleCreatePR}
          disabled={!selectedLines || isCreatingPR}
        >
          {isCreatingPR ? '🔄 Creating PR...' : '🚀 Create PR'}
        </Button>
      </div>

      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textAlign: 'center' }}>
        A new branch will be created with your changes and a PR opened for review.
      </p>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function MatchStatusBanner({ 
  autoMatch 
}: { 
  autoMatch: CodeLocation | null 
}) {
  if (!autoMatch) {
    return (
      <div style={{
        padding: '10px 14px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 6,
        fontSize: 12,
        color: '#dc2626',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <div>
          <strong>Could not auto-detect the code location.</strong>
          <div style={{ marginTop: 4, color: '#991b1b' }}>
            Please enable "Manual selection mode" and select the lines to replace.
          </div>
        </div>
      </div>
    );
  }

  const styles = {
    high: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '✅' },
    medium: { bg: '#fefce8', border: '#fef08a', text: '#854d0e', icon: '🔶' },
    low: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: '⚠️' },
  };

  const style = styles[autoMatch.confidence];
  const hasMultipleInstances = autoMatch.allInstances && autoMatch.allInstances.length > 1;

  return (
    <div style={{
      padding: '10px 14px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 6,
      fontSize: 12,
      color: style.text,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <strong>
            {autoMatch.confidence === 'high' && 'Match found!'}
            {autoMatch.confidence === 'medium' && 'Likely match found - please verify'}
            {autoMatch.confidence === 'low' && 'Possible match - please verify carefully'}
          </strong>
          <span style={{ marginLeft: 8, opacity: 0.8 }}>
            Lines {autoMatch.lineStart}-{autoMatch.lineEnd}
          </span>
        </div>
        {hasMultipleInstances && (
          <span style={{
            fontSize: 10,
            background: style.border,
            color: style.text,
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 600,
          }}>
            {autoMatch.allInstances!.length} instances
          </span>
        )}
      </div>
      
      <div style={{ marginTop: 6, paddingLeft: 28, fontSize: 11, opacity: 0.9 }}>
        {autoMatch.reason}
      </div>
      
      {/* Comment Warning */}
      {autoMatch.isComment && (
        <div style={{
          marginTop: 8,
          padding: '6px 10px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: 4,
          fontSize: 11,
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>⚠️</span>
          <span>
            <strong>Warning:</strong> This appears to be in a comment or type definition, not actual code.
            {hasMultipleInstances && ' Try navigating to another instance.'}
          </span>
        </div>
      )}
      
      {/* Multiple Instances Navigation Hint */}
      {hasMultipleInstances && !autoMatch.isComment && (
        <div style={{
          marginTop: 8,
          fontSize: 10,
          color: style.text,
          opacity: 0.8,
        }}>
          💡 Use <kbd style={{ 
            background: 'rgba(255,255,255,0.5)', 
            padding: '1px 4px', 
            borderRadius: 2,
            border: `1px solid ${style.border}`,
          }}>↑</kbd> <kbd style={{ 
            background: 'rgba(255,255,255,0.5)', 
            padding: '1px 4px', 
            borderRadius: 2,
            border: `1px solid ${style.border}`,
          }}>↓</kbd> to navigate between instances
        </div>
      )}
    </div>
  );
}

interface InstanceNavigatorProps {
  autoMatch: CodeLocation | null;
  currentInstanceIndex: number;
  onGoToInstance: (index: number) => void;
}

function InstanceNavigator({
  autoMatch,
  currentInstanceIndex,
  onGoToInstance,
}: InstanceNavigatorProps) {
  if (!autoMatch?.allInstances || autoMatch.allInstances.length <= 1) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: '#f8fafc',
      borderRadius: 6,
      border: '1px solid #e2e8f0',
    }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>
        📍 Instance {currentInstanceIndex + 1} of {autoMatch.allInstances.length}
      </span>
      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
        {autoMatch.allInstances.map((instance, idx) => (
          <button
            key={idx}
            onClick={() => onGoToInstance(idx)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: idx === currentInstanceIndex ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              background: idx === currentInstanceIndex ? '#eff6ff' : instance.isComment ? '#fef3c7' : '#fff',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: idx === currentInstanceIndex ? 600 : 400,
              color: instance.isComment ? '#92400e' : '#334155',
            }}
            title={`Line ${instance.lineStart}${instance.isComment ? ' (comment)' : ''}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiffPreview({
  originalCode,
  fixedCode,
}: {
  originalCode: string;
  fixedCode: string;
}) {
  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        fontSize: 11,
        fontWeight: 600,
      }}>
        <div style={{ 
          padding: '6px 12px', 
          background: '#fef2f2', 
          color: '#991b1b',
          borderRight: '1px solid #e2e8f0',
        }}>
          ⊖ Current Code
        </div>
        <div style={{ padding: '6px 12px', background: '#f0fdf4', color: '#166534' }}>
          ⊕ Fixed Code (JSX)
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        lineHeight: 1.5,
      }}>
        <pre style={{
          margin: 0,
          padding: 10,
          background: '#fff5f5',
          borderRight: '1px solid #e2e8f0',
          overflow: 'auto',
          maxHeight: 120,
          whiteSpace: 'pre-wrap',
          color: '#991b1b',
        }}>
          {originalCode}
        </pre>
        <pre style={{
          margin: 0,
          padding: 10,
          background: '#f0fff4',
          overflow: 'auto',
          maxHeight: 120,
          whiteSpace: 'pre-wrap',
          color: '#166534',
        }}>
          {fixedCode}
        </pre>
      </div>
    </div>
  );
}

/**
 * Highlight matching text/classes in a line
 */
function highlightMatches(
  line: string, 
  originalCode: string, 
  textContent: string | null
): React.ReactNode {
  // Extract classes from original code to highlight
  const classes = extractAllClasses(originalCode);
  const significantClasses = classes.filter(c => c.length > 5).slice(0, 3);
  
  // If line contains text content, highlight it
  if (textContent && line.includes(textContent)) {
    const parts = line.split(textContent);
    return (
      <>
        {parts[0]}
        <mark style={{ 
          background: '#fde047', 
          padding: '0 2px', 
          borderRadius: 2 
        }}>
          {textContent}
        </mark>
        {parts.slice(1).join(textContent)}
      </>
    );
  }
  
  // If line contains significant classes, highlight them
  for (const cls of significantClasses) {
    if (line.includes(cls)) {
      const parts = line.split(cls);
      return (
        <>
          {parts[0]}
          <mark style={{ 
            background: '#bfdbfe', 
            padding: '0 2px', 
            borderRadius: 2 
          }}>
            {cls}
          </mark>
          {parts.slice(1).join(cls)}
        </>
      );
    }
  }
  
  return line || ' ';
}