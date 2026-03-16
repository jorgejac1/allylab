import { useState } from 'react';
import { Button, Card } from '../ui';
import { useGitHub } from '../../hooks/useGitHub';
import { PermissionGuard } from '../guards/RoleGuard';
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
        <div className="p-5 text-center text-slate-500">
          Loading GitHub connection...
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="mt-0 mb-4 text-base font-semibold">
          GitHub Integration
        </h3>

        {connection.connected && connection.user ? (
          <div>
            {/* Connected State */}
            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <img
                src={connection.user.avatar_url}
                alt={connection.user.login}
                className="w-12 h-12 rounded-full"
                width={48}
                height={48}
                loading="lazy"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {connection.user.name || connection.user.login}
                </div>
                <div className="text-sm text-slate-500">
                  @{connection.user.login}
                </div>
              </div>
              <span className="py-1 px-3 bg-green-100 text-green-700 rounded-full text-xs font-medium inline-flex items-center gap-1">
                <Check size={12} /> Connected
              </span>
            </div>

            {/* Repo Count */}
            {connection.repos && (
              <p className="text-sm text-slate-500 mb-4">
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
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
              <p className="mt-0 mb-3 text-sm text-slate-600">
                Connect GitHub to create Pull Requests with accessibility fixes directly from AllyLab.
              </p>
              <ul className="m-0 pl-5 text-sm text-slate-500">
                <li>Auto-generate PRs for detected issues</li>
                <li>AI-powered code fixes in your preferred framework</li>
                <li>Works with public and private repositories</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {error}
              </div>
            )}

            <PermissionGuard permission="github:connect">
              {showTokenInput ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={e => setToken(e.target.value)}
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
                <Button variant="primary" onClick={() => setShowTokenInput(true)} className="inline-flex items-center gap-1.5">
                  <Link size={14} /> Connect GitHub
                </Button>
              )}
            </PermissionGuard>
          </div>
        )}
      </Card>

      {/* How to get a token */}
      <Card>
        <details className="cursor-pointer">
          <summary className="font-medium text-sm py-2 inline-flex items-center gap-2">
            <Key size={16} /> How to create a GitHub Personal Access Token
          </summary>
          <div className="pl-4 text-sm text-slate-600 leading-relaxed">
            <ol className="my-3 pl-5">
              <li>Go to <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-blue-500">GitHub Token Settings</a></li>
              <li>Click "Generate new token" → "Fine-grained token"</li>
              <li>Set a name like "AllyLab Integration"</li>
              <li>Select repositories you want to access</li>
              <li>Under "Repository permissions", enable:
                <ul className="mt-1">
                  <li><strong>Contents</strong>: Read and write</li>
                  <li><strong>Pull requests</strong>: Read and write</li>
                </ul>
              </li>
              <li>Click "Generate token" and copy it</li>
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
