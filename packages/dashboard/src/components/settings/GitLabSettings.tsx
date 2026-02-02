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
        <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
          Loading GitLab connection...
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          GitLab Integration
        </h3>

        {connection.connected && connection.user ? (
          <div>
            {/* Connected State */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: '#fdf4ff',
              border: '1px solid #f0abfc',
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <img
                src={connection.user.avatar_url}
                alt={connection.user.username}
                style={{ width: 48, height: 48, borderRadius: '50%' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {connection.user.name || connection.user.username}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  @{connection.user.username}
                </div>
                {connection.instanceUrl !== 'https://gitlab.com' && (
                  <div style={{ fontSize: 12, color: '#a855f7', marginTop: 4 }}>
                    {connection.instanceUrl}
                  </div>
                )}
              </div>
              <span style={{
                padding: '4px 12px',
                background: '#fae8ff',
                color: '#a21caf',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <Check size={12} /> Connected
              </span>
            </div>

            {/* Project Count */}
            {connection.projects && (
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
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
            <div style={{
              padding: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569' }}>
                Connect GitLab to create Merge Requests with accessibility fixes directly from AllyLab.
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#64748b' }}>
                <li>Auto-generate MRs for detected issues</li>
                <li>AI-powered code fixes in your preferred framework</li>
                <li>Supports GitLab.com and self-hosted instances</li>
              </ul>
            </div>

            {error && (
              <div style={{
                padding: 12,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#dc2626',
                fontSize: 13,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {showTokenInput ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Self-hosted toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showSelfHosted}
                    onChange={(e) => setShowSelfHosted(e.target.checked)}
                  />
                  <Server size={14} />
                  <span style={{ fontSize: 13 }}>Self-hosted GitLab</span>
                </label>

                {showSelfHosted && (
                  <input
                    type="url"
                    placeholder="https://gitlab.yourcompany.com"
                    value={instanceUrl}
                    onChange={(e) => setInstanceUrl(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                )}

                <input
                  type="password"
                  placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Link size={14} /> Connect GitLab
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* How to get a token */}
      <Card>
        <details style={{ cursor: 'pointer' }}>
          <summary style={{ fontWeight: 500, fontSize: 14, padding: '8px 0', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} /> How to create a GitLab Personal Access Token
          </summary>
          <div style={{ paddingLeft: 16, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            <ol style={{ margin: '12px 0', paddingLeft: 20 }}>
              <li>Go to <a href="https://gitlab.com/-/user_settings/personal_access_tokens" target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7' }}>GitLab Access Tokens</a> (or your self-hosted instance)</li>
              <li>Enter a token name like &quot;AllyLab Integration&quot;</li>
              <li>Set an expiration date (optional but recommended)</li>
              <li>Select the following scopes:
                <ul style={{ marginTop: 4 }}>
                  <li><strong>api</strong>: Full API access</li>
                  <li>Or at minimum: <strong>read_repository</strong>, <strong>write_repository</strong></li>
                </ul>
              </li>
              <li>Click &quot;Create personal access token&quot; and copy it</li>
            </ol>
            <p style={{
              padding: 12,
              background: '#fef3c7',
              borderRadius: 6,
              color: '#92400e',
              margin: '12px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertTriangle size={16} /> Your token is stored securely on the server and never exposed to the browser.
            </p>
          </div>
        </details>
      </Card>
    </div>
  );
}
