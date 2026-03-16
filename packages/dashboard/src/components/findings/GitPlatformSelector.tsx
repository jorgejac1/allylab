/**
 * GitPlatformSelector
 *
 * A segmented control that lets the user choose between
 * GitHub and GitLab as the target Git platform.
 */

import { memo } from 'react';
import { Github, GitBranch } from 'lucide-react';

interface GitPlatformSelectorProps {
  value: 'github' | 'gitlab';
  onChange: (platform: 'github' | 'gitlab') => void;
  githubConnected: boolean;
  gitlabConnected: boolean;
}

export const GitPlatformSelector = memo(function GitPlatformSelector({
  value,
  onChange,
  githubConnected,
  gitlabConnected,
}: GitPlatformSelectorProps) {
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => onChange('github')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium border-none cursor-pointer transition-colors ${
          value === 'github'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Github size={16} />
        <span>GitHub</span>
        {githubConnected && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onChange('gitlab')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium border-none border-l border-slate-200 cursor-pointer transition-colors ${
          value === 'gitlab'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        <GitBranch size={16} />
        <span>GitLab</span>
        {gitlabConnected && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        )}
      </button>
    </div>
  );
});
