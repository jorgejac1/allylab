import { memo } from 'react';
import { Button } from '../ui';
import { SeverityBadge } from './SeverityBadge';
import { IssueStatus as StatusBadge } from './IssueStatus';
import { SourceBadge } from './SourceBadge';
import { JiraCell } from './JiraCell';
import { Undo, X } from 'lucide-react';
import type { TrackedFinding } from '../../types';

interface FindingsRowProps {
  finding: TrackedFinding;
  isSelected: boolean;
  jiraIssueKey?: string;
  isLinkingJira: boolean;
  jiraLinkInput: string;
  onToggleSelect: (findingId: string) => void;
  onToggleFalsePositive: (finding: TrackedFinding) => void;
  onViewDetails: (finding: TrackedFinding) => void;
  onJiraLinkInputChange: (value: string) => void;
  onStartJiraLink: (findingId: string) => void;
  onSaveJiraLink: (findingId: string) => void;
  onCancelJiraLink: () => void;
  onRemoveJiraLink: (findingId: string) => void;
  renderPRStatus: (findingId: string) => React.ReactNode;
}

export const FindingsRow = memo(function FindingsRow({
  finding,
  isSelected,
  jiraIssueKey,
  isLinkingJira,
  jiraLinkInput,
  onToggleSelect,
  onToggleFalsePositive,
  onViewDetails,
  onJiraLinkInputChange,
  onStartJiraLink,
  onSaveJiraLink,
  onCancelJiraLink,
  onRemoveJiraLink,
  renderPRStatus,
}: FindingsRowProps) {
  const isFalsePositive = finding.falsePositive;

  return (
    <tr 
      style={{ 
        borderBottom: '1px solid #f1f5f9',
        opacity: isFalsePositive ? 0.6 : 1,
        background: isSelected 
          ? '#f0f9ff' 
          : isFalsePositive 
            ? '#fafafa' 
            : 'transparent',
      }}
    >
      {/* Checkbox */}
      <td style={tdStyle}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(finding.id)}
          style={{ cursor: 'pointer', width: 16, height: 16 }}
        />
      </td>

      {/* Severity */}
      <td style={tdStyle}>
        <SeverityBadge severity={finding.impact} />
      </td>

      {/* Tracking Status */}
      <td style={tdStyle}>
        <StatusBadge status={finding.status} />
      </td>

      {/* Issue Title + Description */}
      <td style={{ ...tdStyle, maxWidth: 400 }}>
        <div style={{ 
          fontWeight: 600, 
          fontSize: 14,
          marginBottom: 4,
          textDecoration: isFalsePositive ? 'line-through' : 'none',
          color: '#1e293b',
        }}>
          {finding.ruleTitle}
        </div>
        <div style={{ 
          fontSize: 13, 
          color: '#64748b', 
          lineHeight: 1.4,
        }}>
          {finding.description.length > 80 
            ? finding.description.slice(0, 80) + '...' 
            : finding.description}
        </div>
        {isFalsePositive && (
          <span style={{
            display: 'inline-block',
            marginTop: 6,
            fontSize: 10,
            padding: '2px 6px',
            background: '#fef2f2',
            color: '#991b1b',
            borderRadius: 4,
            fontWeight: 500,
          }}>
            False Positive
          </span>
        )}
      </td>

      {/* Source */}
      <td style={tdStyle}>
        <SourceBadge source={finding.source} />
      </td>

      {/* WCAG Tags */}
      <td style={tdStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {finding.wcagTags.slice(0, 2).map(tag => (
            <span 
              key={tag}
              style={{ 
                fontSize: 11, 
                padding: '2px 6px',
                background: '#f1f5f9',
                color: '#475569',
                borderRadius: 4,
                fontFamily: 'monospace',
              }}
            >
              {tag.replace('wcag', '')}
            </span>
          ))}
          {finding.wcagTags.length > 2 && (
            <span 
              style={{ 
                fontSize: 11, 
                color: '#94a3b8',
              }}
              title={finding.wcagTags.join(', ')}
            >
              +{finding.wcagTags.length - 2}
            </span>
          )}
        </div>
      </td>

      {/* JIRA Column */}
      <td style={tdStyle}>
        <JiraCell
          issueKey={jiraIssueKey}
          isLinking={isLinkingJira}
          linkInput={jiraLinkInput}
          onLinkInputChange={onJiraLinkInputChange}
          onStartLink={() => onStartJiraLink(finding.id)}
          onSaveLink={() => onSaveJiraLink(finding.id)}
          onCancelLink={onCancelJiraLink}
          onRemoveLink={() => onRemoveJiraLink(finding.id)}
        />
      </td>

      {/* PR Status Column */}
      <td style={tdStyle}>
        {renderPRStatus(finding.id)}
      </td>

      {/* Actions */}
      <td style={tdStyle}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => onToggleFalsePositive(finding)}
            title={isFalsePositive ? 'Restore finding' : 'Mark as false positive'}
            aria-label={isFalsePositive ? 'Restore finding' : 'Mark as false positive'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: isFalsePositive ? '#15803d' : '#94a3b8',
              padding: '4px 8px',
              borderRadius: 4,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = isFalsePositive ? '#f0fdf4' : '#fef2f2';
              e.currentTarget.style.color = isFalsePositive ? '#15803d' : '#dc2626';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = isFalsePositive ? '#15803d' : '#94a3b8';
            }}
          >
            {isFalsePositive ? <><Undo size={12} aria-hidden="true" style={{ marginRight: 4 }} />Restore</> : <><X size={12} aria-hidden="true" style={{ marginRight: 4 }} />Ignore</>}
          </button>
          <Button variant="secondary" size="sm" onClick={() => onViewDetails(finding)}>
            Details
          </Button>
        </div>
      </td>
    </tr>
  );
});

const tdStyle: React.CSSProperties = {
  padding: '14px 12px',
  verticalAlign: 'middle',
};