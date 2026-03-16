/**
 * GitLab Settings Component
 *
 * Allows users to connect their GitLab account for creating merge requests.
 * Supports both GitLab.com and self-hosted GitLab instances.
 */

import { useState } from 'react';
import { Button, Card } from '../ui';
import { Check, Link, Key, AlertTriangle, Server } from 'lucide-react';
import type { GitLabConnection } from '../../types/gitlab';

interface GitLabSettingsProps {
  connection: GitLabConnection;
  isLoading: boolean;
  error: string | null;
  onConnect: (token: string, instanceUrl: string) => Promise<boolean>;
  onDisconnect: () => Promise<void>;
}

export function GitLabSettings({
  connection,
  isLoading,
  error,
  onConnect,
  onDisconnect,
}: GitLabSettingsProps) {
  const [token, setToken] = useState('');
  const [instanceUrl, setInstanceUrl] = useState('https://gitlab.com');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showSelfHosted, setShowSelfHosted] = useState(false);

  const handleConnect = async () => {
    if (!token.trim()) return;

    setIsConnecting(true);
    const success = await onConnect(token.trim(), instanceUrl);
    if (success) {
      setToken('');
      setShowTokenInput(false);
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect GitLab?')) {
      await onDisconnect();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-5 text-center text-slate-500">
          Loading GitLab connection...
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="mt-0 mb-4 text-base font-semibold">
          GitLab Integration
        </h3>

        {connection.connected && connection.user ? (
          <div>
            {/* Connected State */}
            <div className="flex items-center gap-4 p-4 rounded-lg mb-4" style={{ background: '#fdf4ff', border: '1px solid #f0abfc' }}>
              <img
                src={connection.user.avatar_url}
                alt={connection.user.username}
                className="w-12 h-12 rounded-full"
                width={48}
                height={48}
                loading="lazy"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {connection.user.name || connection.user.username}
                </div>
                <div className="text-sm text-slate-500">
                  @{connection.user.username}
                </div>
                {connection.instanceUrl !== 'https://gitlab.com' && (
                  <div className="text-xs text-purple-500 mt-1">
                    {connection.instanceUrl}
                  </div>
                )}
              </div>
              <span className="py-1 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1" style={{ background: '#fae8ff', color: '#a21caf' }}>
                <Check size={12} /> Connected
              </span>
            </div>

            {/* Project Count */}
            {connection.projects && (
              <p className="text-sm text-slate-500 mb-4">
                Access to {connection.projects.length} projects
              </p>
            )}

            <Button variant="secondary" onClick={handleDisconnect}>
              Disconnect GitLab
            </Button>
          </div>
        ) : (
          <div>
            {/* Disconnected State */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
              <p className="mt-0 mb-3 text-sm text-slate-600">
                Connect GitLab to create Merge Requests with accessibility fixes directly from AllyLab.
              </p>
              <ul className="m-0 pl-5 text-sm text-slate-500">
                <li>Auto-generate MRs for detected issues</li>
                <li>AI-powered code fixes in your preferred framework</li>
                <li>Supports GitLab.com and self-hosted instances</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {error}
              </div>
            )}

            {showTokenInput ? (
              <div className="flex flex-col gap-3">
                {/* Self-hosted toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSelfHosted}
                    onChange={(e) => setShowSelfHosted(e.target.checked)}
                  />
                  <Server size={14} />
                  <span className="text-sm">Self-hosted GitLab</span>
                </label>

                {showSelfHosted && (
                  <input
                    type="url"
                    placeholder="https://gitlab.yourcompany.com"
                    value={instanceUrl}
                    onChange={(e) => setInstanceUrl(e.target.value)}
                    className="py-2.5 px-3 border border-slate-200 rounded-md text-sm"
                  />
                )}

                <input
                  type="password"
                  placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="py-2.5 px-3 border border-slate-200 rounded-md text-sm font-mono"
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleConnect}
                    disabled={isConnecting || !token.trim()}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowTokenInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => setShowTokenInput(true)}
                className="inline-flex items-center gap-1.5"
              >
                <Link size={14} /> Connect GitLab
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* How to get a token */}
      <Card>
        <details className="cursor-pointer">
          <summary className="font-medium text-sm py-2 inline-flex items-center gap-2">
            <Key size={16} /> How to create a GitLab Personal Access Token
          </summary>
          <div className="pl-4 text-sm text-slate-600 leading-relaxed">
            <ol className="my-3 pl-5">
              <li>Go to <a href="https://gitlab.com/-/user_settings/personal_access_tokens" target="_blank" rel="noopener noreferrer" className="text-purple-500">GitLab Access Tokens</a> (or your self-hosted instance)</li>
              <li>Enter a token name like &quot;AllyLab Integration&quot;</li>
              <li>Set an expiration date (optional but recommended)</li>
              <li>Select the following scopes:
                <ul className="mt-1">
                  <li><strong>api</strong>: Full API access</li>
                  <li>Or at minimum: <strong>read_repository</strong>, <strong>write_repository</strong></li>
                </ul>
              </li>
              <li>Click &quot;Create personal access token&quot; and copy it</li>
            </ol>
            <p className="p-3 bg-amber-100 rounded-md text-amber-800 mt-3 mb-0 flex items-center gap-2">
              <AlertTriangle size={16} /> Your token is stored securely on the server and never exposed to the browser.
            </p>
          </div>
        </details>
      </Card>
    </div>
  );
}
