import { forwardRef } from 'react';
import { extractAllClasses } from '../utils';
import type { SelectedLines, CodeLocation } from './types';

interface CodeViewerProps {
  lines: string[];
  selectedLines: SelectedLines | null;
  autoMatch: CodeLocation | null;
  manualMode: boolean;
  originalCode: string;
  textContent: string | null;
  onLineClick: (lineNum: number) => void;
}

export const CodeViewer = forwardRef<HTMLDivElement, CodeViewerProps>(
  function CodeViewer({
    lines,
    selectedLines,
    autoMatch,
    manualMode,
    originalCode,
    textContent,
    onLineClick,
  }, ref) {
    return (
      <div
        ref={ref}
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
              <CodeLine
                key={idx}
                line={line}
                lineNum={lineNum}
                isSelected={isSelected ?? false}
                isMatchStart={isMatchStart ?? false}
                isEvenLine={idx % 2 === 0}
                manualMode={manualMode}
                originalCode={originalCode}
                textContent={textContent}
                onClick={() => onLineClick(lineNum)}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

interface CodeLineProps {
  line: string;
  lineNum: number;
  isSelected: boolean;
  isMatchStart: boolean;
  isEvenLine: boolean;
  manualMode: boolean;
  originalCode: string;
  textContent: string | null;
  onClick: () => void;
}

function CodeLine({
  line,
  lineNum,
  isSelected,
  isMatchStart,
  isEvenLine,
  manualMode,
  originalCode,
  textContent,
  onClick,
}: CodeLineProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        background: isSelected ? '#fef3c7' : isEvenLine ? '#fff' : '#fafafa',
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
