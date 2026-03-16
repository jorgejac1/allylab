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
      <div className="flex justify-between items-center mb-2">
        <label className="text-[13px] font-medium text-slate-600 inline-flex items-center gap-1.5">
          <FolderGit2 size={14} /> Repository
        </label>
        {selectedRepo && !showSelector && (
          <button
            onClick={onShowSelector}
            className="bg-none border-none text-blue-500 text-xs cursor-pointer"
          >
            Change
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-[13px]">Loading repositories...</div>
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
      <div className="text-slate-500 text-[13px] p-2.5">
        No repositories found.
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-md max-h-[200px] overflow-auto">
      {repos.map(repo => (
        <button
          key={repo.id}
          onClick={() => onSelect(repo)}
          className={`w-full py-2.5 px-3 border-none border-b border-slate-100 text-left cursor-pointer flex items-center gap-2.5 text-[13px] ${
            selectedRepo?.id === repo.id
              ? 'bg-sky-50'
              : 'bg-white hover:bg-slate-50'
          }`}
        >
          <img
            src={repo.owner.avatar_url}
            alt=""
            className="w-5 h-5 rounded"
            width={20}
            height={20}
            loading="lazy"
          />
          <span className="flex-1">{repo.full_name}</span>
          {selectedRepo?.id === repo.id && (
            <Check size={14} className="text-blue-500" />
          )}
        </button>
      ))}
    </div>
  );
}

function SelectedRepoDisplay({ repo }: { repo: GitHubRepo }) {
  return (
    <div className="py-2.5 px-3 bg-slate-50 rounded-md flex items-center gap-2.5">
      <img
        src={repo.owner.avatar_url}
        alt=""
        className="w-6 h-6 rounded"
        width={24}
        height={24}
        loading="lazy"
      />
      <span className="text-sm font-medium">
        {repo.full_name}
      </span>
    </div>
  );
}
