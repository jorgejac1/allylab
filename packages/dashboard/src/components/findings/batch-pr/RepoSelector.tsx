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
      <p className="text-slate-500 text-sm mb-4">
        Select the repository where you want to apply {fixCount} fixes:
      </p>

      {isLoading ? (
        <div className="text-center p-5 text-slate-500">
          Loading repositories...
        </div>
      ) : (
        <div className="max-h-[400px] overflow-auto border border-slate-200 rounded-lg">
          {repos.map(repo => (
            <RepoRow key={repo.id} repo={repo} onSelect={() => onSelect(repo)} />
          ))}
        </div>
      )}

      <div className="flex justify-start mt-4">
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
      className="w-full py-3 px-4 border-none border-b border-slate-200 bg-white hover:bg-slate-50 text-left cursor-pointer flex items-center gap-3"
    >
      <img
        src={repo.owner.avatar_url}
        alt=""
        className="w-6 h-6 rounded"
        width={24}
        height={24}
        loading="lazy"
      />
      <div className="flex-1">
        <div className="font-medium text-sm">{repo.full_name}</div>
        <div className="text-xs text-slate-500">
          {repo.private ? '🔒 Private' : '🌐 Public'} • {repo.default_branch}
        </div>
      </div>
      <span className="text-slate-400">→</span>
    </button>
  );
}
