import { useState } from 'react';
import { Button, Card } from '../ui';
import { useWebhooks } from '../../hooks/useWebhooks';
import type { WebhookEvent, WebhookType } from '../../types/webhook';

const EVENT_OPTIONS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'scan.completed', label: 'Scan Completed', description: 'When a scan finishes successfully' },
  { value: 'scan.failed', label: 'Scan Failed', description: 'When a scan encounters an error' },
  { value: 'score.dropped', label: 'Score Dropped', description: 'When score decreases from previous scan' },
  { value: 'critical.found', label: 'Critical Found', description: 'When critical issues are detected' },
];

const PLATFORM_OPTIONS: { value: WebhookType; label: string; icon: string; placeholder: string; help: string }[] = [
  { 
    value: 'slack', 
    label: 'Slack', 
    icon: '💬',
    placeholder: 'https://hooks.slack.com/services/...',
    help: 'Create an Incoming Webhook in Slack App settings'
  },
  { 
    value: 'teams', 
    label: 'Microsoft Teams', 
    icon: '👥',
    placeholder: 'https://outlook.office.com/webhook/...',
    help: 'Add an Incoming Webhook connector to your Teams channel'
  },
  { 
    value: 'generic', 
    label: 'Generic Webhook', 
    icon: '🔗',
    placeholder: 'https://your-server.com/webhook',
    help: 'Custom endpoint receiving JSON payload with HMAC signature'
  },
];

export function WebhookManager() {
  const { webhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook } = useWebhooks();
  
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [platform, setPlatform] = useState<WebhookType>('slack');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>(['scan.completed']);
  const [isAdding, setIsAdding] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);

  const currentPlatform = PLATFORM_OPTIONS.find(p => p.value === platform)!;

  const handleAdd = async () => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) return;
    
    setIsAdding(true);
    await createWebhook(name.trim(), url.trim(), selectedEvents, secret.trim() || undefined, platform);
    setName('');
    setUrl('');
    setSecret('');
    setSelectedEvents(['scan.completed']);
    setIsAdding(false);
  };

  const handleToggleEvent = (event: WebhookEvent) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    const result = await testWebhook(id);
    setTestResult({ id, ...result });
    setTestingId(null);
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    await updateWebhook(id, { enabled });
  };

  const getPlatformIcon = (type: WebhookType) => {
    return PLATFORM_OPTIONS.find(p => p.value === type)?.icon || '🔗';
  };

  const getPlatformLabel = (type: WebhookType) => {
    return PLATFORM_OPTIONS.find(p => p.value === type)?.label || 'Generic';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Add Webhook Form */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          Add Notification
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Platform Selection */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 8, display: 'block' }}>
              Platform
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PLATFORM_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPlatform(opt.value)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: platform === opt.value 
                      ? '2px solid #3b82f6' 
                      : '1px solid #e2e8f0',
                    background: platform === opt.value ? '#eff6ff' : '#fff',
                    color: platform === opt.value ? '#1d4ed8' : '#374151',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              💡 {currentPlatform.help}
            </p>
          </div>

          {/* Name & URL */}
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="Notification name (e.g., #a11y-alerts)"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
            <input
              type="url"
              placeholder={currentPlatform.placeholder}
              value={url}
              onChange={e => setUrl(e.target.value)}
              style={{ ...inputStyle, flex: 2 }}
            />
          </div>

          {/* Secret (only for generic) */}
          {platform === 'generic' && (
            <input
              type="password"
              placeholder="Secret (optional) - for HMAC signature verification"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              style={inputStyle}
            />
          )}

          {/* Events */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 8, display: 'block' }}>
              Trigger on events:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EVENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleToggleEvent(opt.value)}
                  title={opt.description}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: selectedEvents.includes(opt.value) 
                      ? '2px solid #3b82f6' 
                      : '1px solid #e2e8f0',
                    background: selectedEvents.includes(opt.value) ? '#eff6ff' : '#fff',
                    color: selectedEvents.includes(opt.value) ? '#1d4ed8' : '#64748b',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={isAdding || !name.trim() || !url.trim() || selectedEvents.length === 0}
          >
            {isAdding ? 'Adding...' : `Add ${currentPlatform.label} Notification`}
          </Button>
        </div>
      </Card>

      {/* Webhook List */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          Notifications ({webhooks.length})
        </h3>

        {webhooks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              No notifications configured. Add Slack or Teams above to get alerted on scan results.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                style={{
                  padding: 16,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: webhook.enabled ? '#fff' : '#f8fafc',
                  opacity: webhook.enabled ? 1 : 0.7,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleEnabled(webhook.id, !webhook.enabled)}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      border: 'none',
                      background: webhook.enabled ? '#10b981' : '#cbd5e1',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: webhook.enabled ? 20 : 2,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>

                  {/* Platform Icon */}
                  <span style={{ fontSize: 20 }} title={getPlatformLabel(webhook.type)}>
                    {getPlatformIcon(webhook.type)}
                  </span>

                  {/* Name */}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{webhook.name}</span>

                  {/* Platform Badge */}
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500,
                      background: webhook.type === 'slack' ? '#4A154B' 
                        : webhook.type === 'teams' ? '#464EB8' 
                        : '#64748b',
                      color: '#fff',
                    }}
                  >
                    {getPlatformLabel(webhook.type)}
                  </span>

                  {/* Status */}
                  {webhook.lastStatus && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        background: webhook.lastStatus === 'success' ? '#dcfce7' : '#fef2f2',
                        color: webhook.lastStatus === 'success' ? '#15803d' : '#dc2626',
                      }}
                    >
                      {webhook.lastStatus === 'success' ? '✓ Success' : '✕ Failed'}
                    </span>
                  )}

                  <div style={{ flex: 1 }} />

                  {/* Test Result */}
                  {testResult?.id === webhook.id && (
                    <span style={{ fontSize: 12, color: testResult.success ? '#15803d' : '#dc2626' }}>
                      {testResult.success ? '✓ Test passed' : `✕ ${testResult.error || 'Test failed'}`}
                    </span>
                  )}

                  {/* Actions */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTest(webhook.id)}
                    disabled={testingId === webhook.id}
                  >
                    {testingId === webhook.id ? 'Testing...' : '🧪 Test'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWebhook(webhook.id)}
                    style={{ color: '#dc2626' }}
                  >
                    🗑️
                  </Button>
                </div>

                {/* URL */}
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                    {webhook.url.length > 60 ? webhook.url.substring(0, 60) + '...' : webhook.url}
                  </code>
                </div>

                {/* Events */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {webhook.events.map(event => (
                    <span
                      key={event}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        background: '#e0e7ff',
                        color: '#3730a3',
                      }}
                    >
                      {event}
                    </span>
                  ))}
                </div>

                {/* Last Triggered */}
                {webhook.lastTriggered && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                    Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Platform Setup Guides */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          📖 Setup Guides
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Slack Setup */}
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontWeight: 500, fontSize: 14, padding: '8px 0' }}>
              💬 How to set up Slack notifications
            </summary>
            <div style={{ paddingLeft: 16, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <ol style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>api.slack.com/apps</a></li>
                <li>Create a new app or select an existing one</li>
                <li>Navigate to "Incoming Webhooks" and enable it</li>
                <li>Click "Add New Webhook to Workspace"</li>
                <li>Select the channel where you want notifications</li>
                <li>Copy the webhook URL and paste it above</li>
              </ol>
            </div>
          </details>

          {/* Teams Setup */}
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontWeight: 500, fontSize: 14, padding: '8px 0' }}>
              👥 How to set up Microsoft Teams notifications
            </summary>
            <div style={{ paddingLeft: 16, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <ol style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>Open Microsoft Teams and navigate to the channel</li>
                <li>Click the "..." menu next to the channel name</li>
                <li>Select "Connectors" (or "Workflows" in newer versions)</li>
                <li>Find "Incoming Webhook" and click "Configure"</li>
                <li>Give it a name and optional image</li>
                <li>Copy the webhook URL and paste it above</li>
              </ol>
            </div>
          </details>

          {/* Generic Webhook */}
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontWeight: 500, fontSize: 14, padding: '8px 0' }}>
              🔗 Generic webhook payload format
            </summary>
            <div style={{ paddingLeft: 16, fontSize: 13 }}>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 12,
                  overflow: 'auto',
                  marginTop: 8,
                }}
              >
{`{
  "event": "scan.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "scanUrl": "https://example.com",
    "score": 85,
    "totalIssues": 12,
    "critical": 0,
    "serious": 3,
    "moderate": 5,
    "minor": 4,
    "pagesScanned": 5
  }
}

Headers:
- X-AllyLab-Event: scan.completed
- X-AllyLab-Signature: sha256=<hmac>
- X-AllyLab-Delivery: <timestamp>`}
              </pre>
            </div>
          </details>
        </div>
      </Card>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 14,
};