import type { GitHubRepo } from '../../../types/github';
import { FolderGit2, Check } from 'lucide-react';

interface RepoSelectorProps {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  isLoading: boolean;
  showSelector: boolean;
  onSelect: (repo: GitHubRepo) => void;
  onShowSelector: () => void;
}

export function RepoSelector({
  repos,
  selectedRepo,
  isLoading,
  showSelector,
  onSelect,
  onShowSelector,
}: RepoSelectorProps) {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FolderGit2 size={14} /> Repository
        </label>
        {selectedRepo && !showSelector && (
          <button
            onClick={onShowSelector}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Change
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ color: '#64748b', fontSize: 13 }}>Loading repositories...</div>
      ) : showSelector || !selectedRepo ? (
        <RepoList repos={repos} selectedRepo={selectedRepo} onSelect={onSelect} />
      ) : (
        <SelectedRepoDisplay repo={selectedRepo} />
      )}
    </div>
  );
}

function RepoList({
  repos,
  selectedRepo,
  onSelect,
}: {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  onSelect: (repo: GitHubRepo) => void;
}) {
  if (repos.length === 0) {
    return (
      <div style={{ color: '#64748b', fontSize: 13, padding: '10px' }}>
        No repositories found.
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      maxHeight: 200,
      overflow: 'auto',
    }}>
      {repos.map(repo => (
        <button
          key={repo.id}
          onClick={() => onSelect(repo)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: 'none',
            borderBottom: '1px solid #f1f5f9',
            background: selectedRepo?.id === repo.id ? '#f0f9ff' : '#fff',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
          }}
          onMouseEnter={e => {
            if (selectedRepo?.id !== repo.id) {
              e.currentTarget.style.background = '#f8fafc';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = selectedRepo?.id === repo.id ? '#f0f9ff' : '#fff';
          }}
        >
          <img
            src={repo.owner.avatar_url}
            alt=""
            style={{ width: 20, height: 20, borderRadius: 4 }}
          />
          <span style={{ flex: 1 }}>{repo.full_name}</span>
          {selectedRepo?.id === repo.id && (
            <Check size={14} style={{ color: '#3b82f6' }} />
          )}
        </button>
      ))}
    </div>
  );
}

function SelectedRepoDisplay({ repo }: { repo: GitHubRepo }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: '#f8fafc',
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <img
        src={repo.owner.avatar_url}
        alt=""
        style={{ width: 24, height: 24, borderRadius: 4 }}
      />
      <span style={{ fontSize: 14, fontWeight: 500 }}>
        {repo.full_name}
      </span>
    </div>
  );
}