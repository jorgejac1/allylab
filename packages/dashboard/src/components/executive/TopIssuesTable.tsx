import { getSeverityColor } from '../../utils/scoreUtils';
import type { TopIssue } from '../../types';

interface TopIssuesTableProps {
  issues: TopIssue[];
  onClickIssue?: (ruleId: string) => void;
}

export function TopIssuesTable({ issues, onClickIssue }: TopIssuesTableProps) {
  if (issues.length === 0) {
    return <p className="text-gray-400 text-sm">No issues found</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2.5 px-3 text-gray-500 font-medium">
              Issue
            </th>
            <th className="text-center py-2.5 px-3 text-gray-500 font-medium">
              Severity
            </th>
            <th className="text-right py-2.5 px-3 text-gray-500 font-medium">
              Count
            </th>
            <th className="text-right py-2.5 px-3 text-gray-500 font-medium">
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
        <p className="text-xs text-gray-400 mt-2 text-center">
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
  const isClickable = !!onClick;

  return (
    <tr
      onClick={() => onClick?.(issue.ruleId)}
      className={[
        'border-b border-gray-100 transition-colors duration-150',
        isEven ? 'bg-white' : 'bg-[#fafafa]',
        isClickable ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default',
      ].join(' ')}
    >
      <td className="p-3 max-w-[300px]">
        <div className="font-medium text-gray-900">{issue.title}</div>
        <div className="text-xs text-gray-400 font-mono">
          {issue.ruleId}
        </div>
      </td>
      <td className="p-3 text-center">
        <span
          className="inline-block py-0.5 px-2 rounded text-[11px] font-semibold uppercase"
          style={{
            background: `${getSeverityColor(issue.severity)}15`,
            color: getSeverityColor(issue.severity),
          }}
        >
          {issue.severity}
        </span>
      </td>
      <td className="p-3 text-right font-semibold tabular-nums">
        {issue.count}
      </td>
      <td className="p-3 text-right text-gray-500">
        {issue.affectedSites} site{issue.affectedSites !== 1 ? 's' : ''}
      </td>
    </tr>
  );
}
