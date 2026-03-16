import type { RepoHeaderProps } from './types';

export function RepoHeader({ repo, branches, selectedBranch, onBranchChange, onChangeRepo }: RepoHeaderProps) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
      <img
        src={repo.owner.avatar_url}
        alt=""
        className="w-8 h-8 rounded-md"
        width={32}
        height={32}
        loading="lazy"
      />
      <div className="flex-1">
        <div className="font-medium text-sm">{repo.full_name}</div>
        <button
          onClick={onChangeRepo}
          className="bg-none border-none text-blue-500 text-xs cursor-pointer p-0"
        >
          Change repository
        </button>
      </div>
      <select
        value={selectedBranch}
        onChange={e => onBranchChange(e.target.value)}
        aria-label="Select branch"
        className="py-1.5 px-2.5 border border-slate-200 rounded-md text-[13px]"
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
