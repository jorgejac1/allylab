import { SeverityBadge, StatusBadge, Button } from '../ui';
import type { TrackedFinding } from '../../types';

interface FindingRowProps {
  finding: TrackedFinding;
  onViewDetails: (finding: TrackedFinding) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export function FindingRow({ finding, onViewDetails, selected, onSelect }: FindingRowProps) {
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      {/* Checkbox (if selectable) */}
      {onSelect && (
        <td style={tdStyle}>
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(finding.id, e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
        </td>
      )}

      {/* Severity */}
      <td style={tdStyle}>
        <SeverityBadge severity={finding.impact} />
      </td>

      {/* Tracking Status */}
      <td style={tdStyle}>
        <StatusBadge status={finding.status} />
      </td>

      {/* Issue */}
      <td style={tdStyle}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{finding.ruleTitle}</div>
        <div style={{ fontSize: 12, color: '#64748b', maxWidth: 400 }}>
          {finding.description.length > 100
            ? finding.description.slice(0, 100) + '...'
            : finding.description}
        </div>
      </td>

      {/* WCAG */}
      <td style={tdStyle}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {finding.wcagTags.length > 0 ? finding.wcagTags.join(', ') : '—'}
        </span>
      </td>

      {/* Element */}
      <td style={tdStyle}>
        <code
          style={{
            fontSize: 11,
            background: '#f1f5f9',
            padding: '2px 6px',
            borderRadius: 4,
            display: 'inline-block',
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={finding.selector}
        >
          {finding.selector.length > 30
            ? finding.selector.slice(0, 30) + '...'
            : finding.selector}
        </code>
      </td>

      {/* Page */}
      {finding.page && (
        <td style={tdStyle}>
        <a
            href={finding.page}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#2563eb' }}
          >
            {new URL(finding.page).pathname}
          </a>
        </td>
      )}

      {/* Actions */}
      <td style={tdStyle}>
        <Button variant="ghost" size="sm" onClick={() => onViewDetails(finding)}>
          Details
        </Button>
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};