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
      <td className="py-3.5 px-3 align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(finding.id)}
          className="cursor-pointer w-4 h-4"
        />
      </td>

      {/* Severity */}
      <td className="py-3.5 px-3 align-middle">
        <SeverityBadge severity={finding.impact} />
      </td>

      {/* Tracking Status */}
      <td className="py-3.5 px-3 align-middle">
        <StatusBadge status={finding.status} />
      </td>

      {/* Issue Title + Description */}
      <td className="py-3.5 px-3 align-middle max-w-[400px]">
        <div className={`font-semibold text-sm mb-1 text-slate-800 ${isFalsePositive ? 'line-through' : ''}`}>
          {finding.ruleTitle}
        </div>
        <div className="text-[13px] text-slate-500 leading-normal">
          {finding.description.length > 80
            ? finding.description.slice(0, 80) + '...'
            : finding.description}
        </div>
        {isFalsePositive && (
          <span className="inline-block mt-1.5 text-[10px] py-0.5 px-1.5 bg-red-50 text-red-800 rounded font-medium">
            False Positive
          </span>
        )}
      </td>

      {/* Source */}
      <td className="py-3.5 px-3 align-middle">
        <SourceBadge source={finding.source} />
      </td>

      {/* WCAG Tags */}
      <td className="py-3.5 px-3 align-middle">
        <div className="flex flex-wrap gap-1">
          {finding.wcagTags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-xs py-0.5 px-1.5 bg-slate-100 text-slate-600 rounded font-mono"
            >
              {tag.replace('wcag', '')}
            </span>
          ))}
          {finding.wcagTags.length > 2 && (
            <span
              className="text-xs text-slate-400"
              title={finding.wcagTags.join(', ')}
            >
              +{finding.wcagTags.length - 2}
            </span>
          )}
        </div>
      </td>

      {/* JIRA Column */}
      <td className="py-3.5 px-3 align-middle">
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
      <td className="py-3.5 px-3 align-middle">
        {renderPRStatus(finding.id)}
      </td>

      {/* Actions */}
      <td className="py-3.5 px-3 align-middle">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => onToggleFalsePositive(finding)}
            title={isFalsePositive ? 'Restore finding' : 'Mark as false positive'}
            aria-label={isFalsePositive ? 'Restore finding' : 'Mark as false positive'}
            className={`bg-none border-none cursor-pointer text-xs py-1 px-2 rounded transition-all duration-150 ${
              isFalsePositive
                ? 'text-green-700 hover:bg-green-50'
                : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            {isFalsePositive ? <><Undo size={12} aria-hidden="true" className="mr-1" />Restore</> : <><X size={12} aria-hidden="true" className="mr-1" />Ignore</>}
          </button>
          <Button variant="secondary" size="sm" onClick={() => onViewDetails(finding)}>
            Details
          </Button>
        </div>
      </td>
    </tr>
  );
});
