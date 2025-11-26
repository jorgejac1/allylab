import { Button } from '../../ui';
import type { GitHubRepo } from '../../../types/github';

interface RepoSelectorProps {
  repos: GitHubRepo[];
  isLoading: boolean;
  fixCount: number;
  onSelect: (repo: GitHubRepo) => void;
  onBack: () => void;
}

export function RepoSelector({
  repos,
  isLoading,
  fixCount,
  onSelect,
  onBack,
}: RepoSelectorProps) {
  return (
    <div>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
        Select the repository where you want to apply {fixCount} fixes:
      </p>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
          Loading repositories...
        </div>
      ) : (
        <div style={{ 
          maxHeight: 400, 
          overflow: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
        }}>
          {repos.map(repo => (
            <RepoRow key={repo.id} repo={repo} onSelect={() => onSelect(repo)} />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
        <Button variant="secondary" onClick={onBack}>
          ← Back
        </Button>
      </div>
    </div>
  );
}

interface RepoRowProps {
  repo: GitHubRepo;
  onSelect: () => void;
}

function RepoRow({ repo, onSelect }: RepoRowProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        borderBottom: '1px solid #e2e8f0',
        background: '#fff',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
    >
      <img
        src={repo.owner.avatar_url}
        alt=""
        style={{ width: 24, height: 24, borderRadius: 4 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{repo.full_name}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          {repo.private ? '🔒 Private' : '🌐 Public'} • {repo.default_branch}
        </div>
      </div>
      <span style={{ color: '#94a3b8' }}>→</span>
    </button>
  );
}