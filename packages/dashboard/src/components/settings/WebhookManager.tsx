import { useState } from 'react';
import { Button, Card } from '../ui';
import { useWebhooks } from '../../hooks/useWebhooks';
import type { WebhookEvent } from '../../types/webhook';

const EVENT_OPTIONS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'scan.completed', label: 'Scan Completed', description: 'When a scan finishes successfully' },
  { value: 'scan.failed', label: 'Scan Failed', description: 'When a scan encounters an error' },
  { value: 'score.dropped', label: 'Score Dropped', description: 'When score decreases from previous scan' },
  { value: 'critical.found', label: 'Critical Found', description: 'When critical issues are detected' },
];

export function WebhookManager() {
  const { webhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook } = useWebhooks();
  
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>(['scan.completed']);
  const [isAdding, setIsAdding] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) return;
    
    setIsAdding(true);
    await createWebhook(name.trim(), url.trim(), selectedEvents, secret.trim() || undefined);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Add Webhook Form */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          Add Webhook
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name & URL */}
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="Webhook name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
            <input
              type="url"
              placeholder="https://hooks.slack.com/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              style={{ ...inputStyle, flex: 2 }}
            />
          </div>

          {/* Secret (optional) */}
          <input
            type="password"
            placeholder="Secret (optional) - for signature verification"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            style={inputStyle}
          />

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
            {isAdding ? 'Adding...' : 'Add Webhook'}
          </Button>
        </div>
      </Card>

      {/* Webhook List */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          Webhooks ({webhooks.length})
        </h3>

        {webhooks.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 14 }}>
            No webhooks configured. Add one above to receive notifications.
          </p>
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

                  {/* Name */}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{webhook.name}</span>

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
                    {webhook.url}
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

      {/* Documentation */}
      <Card>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
          Webhook Payload
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          Webhooks receive a POST request with the following JSON payload:
        </p>
        <pre
          style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            overflow: 'auto',
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
    "minor": 4
  }
}`}
        </pre>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>
          If a secret is set, requests include an <code>X-AllyLab-Signature</code> header with HMAC-SHA256.
        </p>
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