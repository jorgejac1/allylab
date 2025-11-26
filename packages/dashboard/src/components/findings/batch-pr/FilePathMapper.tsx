import { Button } from '../../ui';
import { SeverityDot } from './SeverityDot';
import type { GitHubRepo, GitHubBranch } from '../../../types/github';
import type { FindingWithFix } from '../../../types/batch-pr';

interface FilePathMapperProps {
  selectedRepo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  findings: FindingWithFix[];
  prTitle: string;
  prDescription: string;
  isLoading: boolean;
  error: string | null;
  onBranchChange: (branch: string) => void;
  onFilePathChange: (index: number, path: string) => void;
  onRemoveFinding: (index: number) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onChangeRepo: () => void;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function FilePathMapper({
  selectedRepo,
  branches,
  selectedBranch,
  findings,
  prTitle,
  prDescription,
  isLoading,
  error,
  onBranchChange,
  onFilePathChange,
  onRemoveFinding,
  onTitleChange,
  onDescriptionChange,
  onChangeRepo,
  onBack,
  onCancel,
  onSubmit,
}: FilePathMapperProps) {
  const fixedFindings = findings.filter(f => f.fix);
  const withPathCount = fixedFindings.filter(f => f.filePath.trim()).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RepoHeader
        repo={selectedRepo}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={onBranchChange}
        onChangeRepo={onChangeRepo}
      />

      <FilePathList
        findings={fixedFindings}
        allFindings={findings}
        withPathCount={withPathCount}
        onFilePathChange={onFilePathChange}
        onRemoveFinding={onRemoveFinding}
      />

      <PRFormFields
        prTitle={prTitle}
        prDescription={prDescription}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />

      {error && <ErrorMessage message={error} />}

      <FormActions
        isLoading={isLoading}
        withPathCount={withPathCount}
        onBack={onBack}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </div>
  );
}

interface RepoHeaderProps {
  repo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  onChangeRepo: () => void;
}

function RepoHeader({ repo, branches, selectedBranch, onBranchChange, onChangeRepo }: RepoHeaderProps) {
  return (
    <div style={{
      padding: 12,
      background: '#f8fafc',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <img
        src={repo.owner.avatar_url}
        alt=""
        style={{ width: 32, height: 32, borderRadius: 6 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{repo.full_name}</div>
        <button
          onClick={onChangeRepo}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: 12,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Change repository
        </button>
      </div>
      <select
        value={selectedBranch}
        onChange={e => onBranchChange(e.target.value)}
        style={{
          padding: '6px 10px',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        {branches.map(branch => (
          <option key={branch.name} value={branch.name}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FilePathListProps {
  findings: FindingWithFix[];
  allFindings: FindingWithFix[];
  withPathCount: number;
  onFilePathChange: (index: number, path: string) => void;
  onRemoveFinding: (index: number) => void;
}

function FilePathList({ findings, allFindings, withPathCount, onFilePathChange, onRemoveFinding }: FilePathListProps) {
  return (
    <div>
      <label style={{ 
        fontSize: 13, 
        fontWeight: 500, 
        color: '#475569', 
        marginBottom: 8, 
        display: 'block' 
      }}>
        File Paths ({withPathCount}/{findings.length} mapped)
      </label>
      <div style={{ 
        maxHeight: 250, 
        overflow: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
      }}>
        {findings.map((item) => {
          const originalIndex = allFindings.indexOf(item);
          return (
            <FilePathRow
              key={item.finding.id}
              item={item}
              onFilePathChange={(path) => onFilePathChange(originalIndex, path)}
              onRemove={() => onRemoveFinding(originalIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface FilePathRowProps {
  item: FindingWithFix;
  onFilePathChange: (path: string) => void;
  onRemove: () => void;
}

function FilePathRow({ item, onFilePathChange, onRemove }: FilePathRowProps) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <SeverityDot severity={item.finding.impact} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontSize: 13, 
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {item.finding.ruleTitle}
        </div>
        <input
          type="text"
          placeholder="src/components/Example.tsx"
          value={item.filePath}
          onChange={e => onFilePathChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #e2e8f0',
            borderRadius: 4,
            fontSize: 12,
            marginTop: 4,
          }}
        />
      </div>
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 4,
          fontSize: 16,
        }}
        title="Remove from PR"
      >
        ×
      </button>
    </div>
  );
}

interface PRFormFieldsProps {
  prTitle: string;
  prDescription: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

function PRFormFields({ prTitle, prDescription, onTitleChange, onDescriptionChange }: PRFormFieldsProps) {
  return (
    <>
      <div>
        <label style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: '#475569', 
          marginBottom: 6, 
          display: 'block' 
        }}>
          PR Title
        </label>
        <input
          type="text"
          value={prTitle}
          onChange={e => onTitleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </div>

      <div>
        <label style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: '#475569', 
          marginBottom: 6, 
          display: 'block' 
        }}>
          Description (optional)
        </label>
        <textarea
          placeholder="Additional context for reviewers..."
          value={prDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
            resize: 'vertical',
          }}
        />
      </div>
    </>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{
      padding: 12,
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: 8,
      color: '#dc2626',
      fontSize: 13,
    }}>
      {message}
    </div>
  );
}

interface FormActionsProps {
  isLoading: boolean;
  withPathCount: number;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function FormActions({ isLoading, withPathCount, onBack, onCancel, onSubmit }: FormActionsProps) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 12, 
      justifyContent: 'space-between', 
      marginTop: 8 
    }}>
      <Button variant="secondary" onClick={onBack}>
        ← Back
      </Button>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={isLoading || withPathCount === 0}
        >
          {isLoading ? 'Creating PR...' : `🚀 Create PR (${withPathCount} fixes)`}
        </Button>
      </div>
    </div>
  );
}