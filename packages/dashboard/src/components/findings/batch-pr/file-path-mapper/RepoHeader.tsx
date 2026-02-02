import type { RepoHeaderProps } from './types';

export function RepoHeader({ repo, branches, selectedBranch, onBranchChange, onChangeRepo }: RepoHeaderProps) {
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
        aria-label="Select branch"
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
