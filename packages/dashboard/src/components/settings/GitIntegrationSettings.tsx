/**
 * Git Integration Settings Component
 *
 * Unified settings for GitHub and GitLab integrations with provider selector.
 */

import { useState } from 'react';
import { Card } from '../ui';
import { GitHubSettings } from './GitHubSettings';
import { GitLabSettings } from './GitLabSettings';
import { PermissionGuard } from '../guards/RoleGuard';
import { useGitHub } from '../../hooks/useGitHub';
import { useGitLab } from '../../hooks/useGitLab';

type GitProvider = 'github' | 'gitlab';

export function GitIntegrationSettings() {
  const [selectedProvider, setSelectedProvider] = useState<GitProvider>('github');

  const github = useGitHub();
  const gitlab = useGitLab();

  // Determine which provider is connected
  const githubConnected = github.connection.connected;
  const gitlabConnected = gitlab.connection.connected;

  return (
    <div data-testid="git-integration-settings" className="flex flex-col gap-6">
      {/* Provider Selector */}
      <Card>
        <h3 className="mt-0 mb-4 text-base font-semibold">
          Git Provider
        </h3>
        <p className="mt-0 mb-4 text-sm text-slate-500">
          Connect your preferred Git provider to create pull/merge requests with accessibility fixes.
        </p>

        <div className="flex gap-3">
          <ProviderCard
            provider="github"
            name="GitHub"
            icon={<GitHubIcon />}
            connected={githubConnected}
            selected={selectedProvider === 'github'}
            onClick={() => setSelectedProvider('github')}
          />
          <ProviderCard
            provider="gitlab"
            name="GitLab"
            icon={<GitLabIcon />}
            connected={gitlabConnected}
            selected={selectedProvider === 'gitlab'}
            onClick={() => setSelectedProvider('gitlab')}
          />
        </div>

        {/* Connection status summary */}
        {(githubConnected || gitlabConnected) && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            {githubConnected && gitlabConnected ? (
              <span>Both GitHub and GitLab are connected. You can use either for creating fixes.</span>
            ) : githubConnected ? (
              <span>GitHub is connected. Click on GitLab above to add it as well.</span>
            ) : (
              <span>GitLab is connected. Click on GitHub above to add it as well.</span>
            )}
          </div>
        )}
      </Card>

      {/* Provider-specific settings */}
      <PermissionGuard permission="github:connect">
        {selectedProvider === 'github' ? (
          <GitHubSettings />
        ) : (
          <GitLabSettings
            connection={gitlab.connection}
            isLoading={gitlab.isLoading}
            error={gitlab.error}
            onConnect={gitlab.connect}
            onDisconnect={gitlab.disconnect}
          />
        )}
      </PermissionGuard>
    </div>
  );
}

interface ProviderCardProps {
  provider: GitProvider;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  selected: boolean;
  onClick: () => void;
}

function ProviderCard({ name, icon, connected, selected, onClick }: ProviderCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all duration-150 relative"
      style={{
        background: selected ? '#f8fafc' : 'white',
        border: selected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
      }}
    >
      <div className="w-10 h-10">{icon}</div>
      <span className="font-medium text-sm">{name}</span>
      {connected && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
      )}
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GitLabIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.452.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.443a.92.92 0 00.33-1.024" fill="#E24329"/>
      <path d="M12 23.054L16.418 9.45H7.582L12 23.054z" fill="#FC6D26"/>
      <path d="M12 23.054l-4.418-13.6H1.386L12 23.054z" fill="#FCA326"/>
      <path d="M1.386 9.452L.044 13.587a.924.924 0 00.331 1.023L12 23.054 1.386 9.452z" fill="#E24329"/>
      <path d="M1.386 9.452h6.196L4.918 1.263a.455.455 0 00-.867 0L1.386 9.452z" fill="#FC6D26"/>
      <path d="M12 23.054l4.418-13.6h6.196L12 23.054z" fill="#FCA326"/>
      <path d="M22.614 9.452l1.342 4.135a.924.924 0 01-.331 1.023L12 23.054l10.614-13.602z" fill="#E24329"/>
      <path d="M22.614 9.452h-6.196l2.664-8.189a.455.455 0 01.867 0l2.665 8.189z" fill="#FC6D26"/>
    </svg>
  );
}
