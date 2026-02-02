/**
 * Git Integration Settings Component
 *
 * Unified settings for GitHub and GitLab integrations with provider selector.
 */

import { useState } from 'react';
import { Card } from '../ui';
import { GitHubSettings } from './GitHubSettings';
import { GitLabSettings } from './GitLabSettings';
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
    <div data-testid="git-integration-settings" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Provider Selector */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          Git Provider
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>
          Connect your preferred Git provider to create pull/merge requests with accessibility fixes.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
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
          <div style={{
            marginTop: 16,
            padding: 12,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            fontSize: 13,
          }}>
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
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        background: selected ? '#f8fafc' : 'white',
        border: selected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      <div style={{ width: 40, height: 40 }}>{icon}</div>
      <span style={{ fontWeight: 500, fontSize: 14 }}>{name}</span>
      {connected && (
        <span style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 8,
          height: 8,
          background: '#22c55e',
          borderRadius: '50%',
        }} />
      )}
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GitLabIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
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
