import { memo } from 'react';
import { SeverityBadge, StatusBadge, Button } from '../ui';
import type { TrackedFinding } from '../../types';

interface FindingRowProps {
  finding: TrackedFinding;
  onViewDetails: (finding: TrackedFinding) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export const FindingRow = memo(function FindingRow({ finding, onViewDetails, selected, onSelect }: FindingRowProps) {
  return (
    <tr className="border-b border-slate-100">
      {/* Checkbox (if selectable) */}
      {onSelect && (
        <td className="py-3 px-4 align-middle">
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(finding.id, e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
        </td>
      )}

      {/* Severity */}
      <td className="py-3 px-4 align-middle">
        <SeverityBadge severity={finding.impact} />
      </td>

      {/* Tracking Status */}
      <td className="py-3 px-4 align-middle">
        <StatusBadge status={finding.status} />
      </td>

      {/* Issue */}
      <td className="py-3 px-4 align-middle">
        <div className="font-medium mb-1">{finding.ruleTitle}</div>
        <div className="text-xs text-slate-500 max-w-[400px]">
          {finding.description.length > 100
            ? finding.description.slice(0, 100) + '...'
            : finding.description}
        </div>
      </td>

      {/* WCAG */}
      <td className="py-3 px-4 align-middle">
        <span className="text-xs text-slate-500">
          {finding.wcagTags.length > 0 ? finding.wcagTags.join(', ') : '—'}
        </span>
      </td>

      {/* Element */}
      <td className="py-3 px-4 align-middle">
        <code
          className="text-xs bg-slate-100 py-0.5 px-1.5 rounded inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
          title={finding.selector}
        >
          {finding.selector.length > 30
            ? finding.selector.slice(0, 30) + '...'
            : finding.selector}
        </code>
      </td>

      {/* Page */}
      {finding.page && (
        <td className="py-3 px-4 align-middle">
        <a
            href={finding.page}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600"
          >
            {new URL(finding.page).pathname}
          </a>
        </td>
      )}

      {/* Actions */}
      <td className="py-3 px-4 align-middle">
        <Button variant="ghost" size="sm" onClick={() => onViewDetails(finding)}>
          Details
        </Button>
      </td>
    </tr>
  );
});
