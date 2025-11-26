import { getSeverityColor } from '../../utils/scoreUtils';
import type { TopIssue } from '../../types';

interface TopIssuesTableProps {
  issues: TopIssue[];
  onClickIssue?: (ruleId: string) => void;
}

export function TopIssuesTable({ issues, onClickIssue }: TopIssuesTableProps) {
  if (issues.length === 0) {
    return <p style={{ color: '#9ca3af', fontSize: 14 }}>No issues found</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 500 }}>
              Issue
            </th>
            <th style={{ textAlign: 'center', padding: '10px 12px', color: '#6b7280', fontWeight: 500 }}>
              Severity
            </th>
            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#6b7280', fontWeight: 500 }}>
              Count
            </th>
            <th style={{ textAlign: 'right', padding: '10px 12px', color: '#6b7280', fontWeight: 500 }}>
              Sites
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, idx) => (
            <TopIssueRow 
              key={issue.ruleId} 
              issue={issue} 
              isEven={idx % 2 === 0}
              onClick={onClickIssue}
            />
          ))}
        </tbody>
      </table>
      {onClickIssue && (
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
          Click a row to view all instances of this issue
        </p>
      )}
    </div>
  );
}

function TopIssueRow({ 
  issue, 
  isEven, 
  onClick 
}: { 
  issue: TopIssue; 
  isEven: boolean;
  onClick?: (ruleId: string) => void;
}) {
  const baseBackground = isEven ? '#fff' : '#fafafa';
  const isClickable = !!onClick;

  return (
    <tr 
      onClick={() => onClick?.(issue.ruleId)}
      style={{ 
        borderBottom: '1px solid #f3f4f6',
        background: baseBackground,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (isClickable) e.currentTarget.style.background = '#f0f9ff';
      }}
      onMouseLeave={(e) => {
        if (isClickable) e.currentTarget.style.background = baseBackground;
      }}
    >
      <td style={{ padding: '12px', maxWidth: 300 }}>
        <div style={{ fontWeight: 500, color: '#111827' }}>{issue.title}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
          {issue.ruleId}
        </div>
      </td>
      <td style={{ padding: '12px', textAlign: 'center' }}>
        <span style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          background: `${getSeverityColor(issue.severity)}15`,
          color: getSeverityColor(issue.severity),
        }}>
          {issue.severity}
        </span>
      </td>
      <td style={{ 
        padding: '12px', 
        textAlign: 'right', 
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums'
      }}>
        {issue.count}
      </td>
      <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>
        {issue.affectedSites} site{issue.affectedSites !== 1 ? 's' : ''}
      </td>
    </tr>
  );
}