import { useState } from 'react';
import { Button, Card } from '../ui';
import { useGitHub } from '../../hooks/useGitHub';
import { Check, Link, Key, AlertTriangle } from 'lucide-react';

export function GitHubSettings() {
  const { connection, isLoading, error, connect, disconnect } = useGitHub();
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleConnect = async () => {
    if (!token.trim()) return;
    
    setIsConnecting(true);
    const success = await connect(token.trim());
    if (success) {
      setToken('');
      setShowTokenInput(false);
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect GitHub?')) {
      await disconnect();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
          Loading GitHub connection...
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          GitHub Integration
        </h3>

        {connection.connected && connection.user ? (
          <div>
            {/* Connected State */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <img
                src={connection.user.avatar_url}
                alt={connection.user.login}
                style={{ width: 48, height: 48, borderRadius: '50%' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {connection.user.name || connection.user.login}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  @{connection.user.login}
                </div>
              </div>
              <span style={{
                padding: '4px 12px',
                background: '#dcfce7',
                color: '#15803d',
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

            {/* Repo Count */}
            {connection.repos && (
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Access to {connection.repos.length} repositories
              </p>
            )}

            <Button variant="secondary" onClick={handleDisconnect}>
              Disconnect GitHub
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
                Connect GitHub to create Pull Requests with accessibility fixes directly from AllyLab.
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#64748b' }}>
                <li>Auto-generate PRs for detected issues</li>
                <li>AI-powered code fixes in your preferred framework</li>
                <li>Works with public and private repositories</li>
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
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={e => setToken(e.target.value)}
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
              <Button variant="primary" onClick={() => setShowTokenInput(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Link size={14} /> Connect GitHub
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* How to get a token */}
      <Card>
        <details style={{ cursor: 'pointer' }}>
          <summary style={{ fontWeight: 500, fontSize: 14, padding: '8px 0', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} /> How to create a GitHub Personal Access Token
          </summary>
          <div style={{ paddingLeft: 16, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            <ol style={{ margin: '12px 0', paddingLeft: 20 }}>
              <li>Go to <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>GitHub Token Settings</a></li>
              <li>Click "Generate new token" → "Fine-grained token"</li>
              <li>Set a name like "AllyLab Integration"</li>
              <li>Select repositories you want to access</li>
              <li>Under "Repository permissions", enable:
                <ul style={{ marginTop: 4 }}>
                  <li><strong>Contents</strong>: Read and write</li>
                  <li><strong>Pull requests</strong>: Read and write</li>
                </ul>
              </li>
              <li>Click "Generate token" and copy it</li>
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