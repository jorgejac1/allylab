import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { findCodeInJsx, htmlToJsx } from '../utils';
import { EditorHeader } from './EditorHeader';
import { MatchStatusBanner } from './MatchStatusBanner';
import { InstanceNavigator } from './InstanceNavigator';
import { EditorControls } from './EditorControls';
import { DiffPreview } from './DiffPreview';
import { CodeViewer } from './CodeViewer';
import { ReplacementPreview, JSXConversionNote, PRInfoNote } from './ReplacementPreview';
import { EditorActions } from './EditorActions';
import type { FileEditorProps, SelectedLines } from './types';

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
  const [selectedLines, setSelectedLines] = useState<SelectedLines | null>(() => {
    if (!fileContent || !originalCode) return null;
    const match = findCodeInJsx(fileContent, originalCode, textContent);
    return match ? { start: match.lineStart, end: match.lineEnd } : null;
  });
  const [manualMode, setManualMode] = useState(false);
  const [showDiffPreview, setShowDiffPreview] = useState(true);
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState(0);

  // Generate preview of updated content
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

      const matchCenter = (autoMatch.lineStart + autoMatch.lineEnd) / 2;
      const scrollTo = (matchCenter * lineHeight) - (containerHeight / 2);

      container.scrollTop = Math.max(0, scrollTo);
    }
  }, [autoMatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && selectedLines && !isCreatingPR) {
        e.preventDefault();
        onCreatePR(updatedContent, selectedLines.start, selectedLines.end);
      }

      if (e.key === 'Escape') {
        onBack();
      }

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
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
          <FileText size={24} aria-hidden="true" />
        </div>
        Loading file content...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EditorHeader filePath={filePath} onBack={onBack} />

      <MatchStatusBanner autoMatch={autoMatch} />

      <InstanceNavigator
        autoMatch={autoMatch}
        currentInstanceIndex={currentInstanceIndex}
        onGoToInstance={goToInstance}
      />

      <EditorControls
        manualMode={manualMode}
        showDiffPreview={showDiffPreview}
        selectedLines={selectedLines}
        onManualModeChange={setManualMode}
        onShowDiffPreviewChange={setShowDiffPreview}
      />

      {showDiffPreview && selectedLines && (
        <DiffPreview originalCode={replacedCode} fixedCode={fixedJsx} />
      )}

      <CodeViewer
        ref={scrollContainerRef}
        lines={lines}
        selectedLines={selectedLines}
        autoMatch={autoMatch}
        manualMode={manualMode}
        originalCode={originalCode}
        textContent={textContent}
        onLineClick={handleLineClick}
      />

      <JSXConversionNote />

      {selectedLines && (
        <ReplacementPreview selectedLines={selectedLines} fixedJsx={fixedJsx} />
      )}

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

      <EditorActions
        selectedLines={selectedLines}
        isCreatingPR={isCreatingPR}
        onBack={onBack}
        onCreatePR={handleCreatePR}
      />

      <PRInfoNote />
    </div>
  );
}
