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
        className="border border-slate-200 rounded-lg max-h-[300px] overflow-auto"
      >
        <div className="font-mono text-xs leading-relaxed">
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
      className="flex transition-colors duration-100"
      style={{
        background: isSelected ? '#fef3c7' : isEvenLine ? '#fff' : '#fafafa',
        cursor: manualMode ? 'pointer' : 'default',
        borderLeft: isSelected ? '3px solid #f59e0b' : '3px solid transparent',
      }}
    >
      <span
        className="w-[50px] py-0.5 px-2 text-right select-none shrink-0"
        style={{
          color: isSelected ? '#92400e' : '#94a3b8',
          background: isSelected ? '#fde68a' : '#f1f5f9',
          fontWeight: isMatchStart ? 700 : 400,
        }}
      >
        {lineNum}
      </span>
      <span
        className="py-0.5 px-3 whitespace-pre overflow-auto flex-1"
        style={{ color: isSelected ? '#78350f' : '#334155' }}
      >
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
        <mark className="bg-yellow-300 px-0.5 rounded-sm">
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
          <mark className="bg-blue-200 px-0.5 rounded-sm">
            {cls}
          </mark>
          {parts.slice(1).join(cls)}
        </>
      );
    }
  }

  return line || ' ';
}
