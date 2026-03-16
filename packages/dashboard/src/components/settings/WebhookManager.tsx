import { useState, type ReactNode } from 'react';
import { Button, Card } from '../ui';
import { useWebhooks } from '../../hooks/useWebhooks';
import { PermissionGuard } from '../guards/RoleGuard';
import type { WebhookEvent, WebhookType } from '../../types/webhook';
import { MessageSquare, Users, Link2, Lightbulb, Bell, FlaskConical, Trash2, BookOpen, Loader2, Check, X } from 'lucide-react';

const EVENT_OPTIONS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'scan.completed', label: 'Scan Completed', description: 'When a scan finishes successfully' },
  { value: 'scan.failed', label: 'Scan Failed', description: 'When a scan encounters an error' },
  { value: 'score.dropped', label: 'Score Dropped', description: 'When score decreases from previous scan' },
  { value: 'critical.found', label: 'Critical Found', description: 'When critical issues are detected' },
];

const PLATFORM_OPTIONS: { value: WebhookType; label: string; icon: ReactNode; placeholder: string; help: string }[] = [
  {
    value: 'slack',
    label: 'Slack',
    icon: <MessageSquare size={24} />,
    placeholder: 'https://hooks.slack.com/services/...',
    help: 'Create an Incoming Webhook in Slack App settings'
  },
  {
    value: 'teams',
    label: 'Microsoft Teams',
    icon: <Users size={24} />,
    placeholder: 'https://outlook.office.com/webhook/...',
    help: 'Add an Incoming Webhook connector to your Teams channel'
  },
  {
    value: 'generic',
    label: 'Generic Webhook',
    icon: <Link2 size={24} />,
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
    return PLATFORM_OPTIONS.find(p => p.value === type)?.icon || <Link2 size={20} />;
  };

  const getPlatformLabel = (type: WebhookType) => {
    return PLATFORM_OPTIONS.find(p => p.value === type)?.label || 'Generic';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Add Webhook Form */}
      <Card>
        <h3 className="mt-0 mb-4 text-base font-semibold">
          Add Notification
        </h3>

        <div className="flex flex-col gap-4">
          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">
              Platform
            </label>
            <div className="flex gap-2">
              {PLATFORM_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPlatform(opt.value)}
                  className="flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all duration-150 text-sm font-medium"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: platform === opt.value
                      ? '2px solid #3b82f6'
                      : '1px solid #e2e8f0',
                    background: platform === opt.value ? '#eff6ff' : '#fff',
                    color: platform === opt.value ? '#1d4ed8' : '#374151',
                  }}
                >
                  <span className="flex items-center justify-center">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <Lightbulb size={14} />{currentPlatform.help}
            </p>
          </div>

          {/* Name & URL */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Notification name (e.g., #a11y-alerts)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 py-2.5 px-3 border border-slate-200 rounded-md text-sm"
            />
            <input
              type="url"
              placeholder={currentPlatform.placeholder}
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex-[2] py-2.5 px-3 border border-slate-200 rounded-md text-sm"
            />
          </div>

          {/* Secret (only for generic) */}
          {platform === 'generic' && (
            <input
              type="password"
              placeholder="Secret (optional) - for HMAC signature verification"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="flex-1 py-2.5 px-3 border border-slate-200 rounded-md text-sm"
            />
          )}

          {/* Events */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-2 block">
              Trigger on events:
            </label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleToggleEvent(opt.value)}
                  title={opt.description}
                  className="cursor-pointer transition-all duration-150 text-sm font-medium"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: selectedEvents.includes(opt.value)
                      ? '2px solid #3b82f6'
                      : '1px solid #e2e8f0',
                    background: selectedEvents.includes(opt.value) ? '#eff6ff' : '#fff',
                    color: selectedEvents.includes(opt.value) ? '#1d4ed8' : '#64748b',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <PermissionGuard permission="webhooks:manage">
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={isAdding || !name.trim() || !url.trim() || selectedEvents.length === 0}
            >
              {isAdding ? 'Adding...' : `Add ${currentPlatform.label} Notification`}
            </Button>
          </PermissionGuard>
        </div>
      </Card>

      {/* Webhook List */}
      <Card>
        <h3 className="mt-0 mb-4 text-base font-semibold">
          Notifications ({webhooks.length})
        </h3>

        {webhooks.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="mb-3 flex justify-center text-slate-400"><Bell size={48} /></div>
            <p className="text-slate-500 text-sm m-0">
              No notifications configured. Add Slack or Teams above to get alerted on scan results.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className="p-4 border border-slate-200 rounded-lg"
                style={{
                  background: webhook.enabled ? '#fff' : '#f8fafc',
                  opacity: webhook.enabled ? 1 : 0.7,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleEnabled(webhook.id, !webhook.enabled)}
                    className="border-none cursor-pointer relative transition-colors duration-200"
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      background: webhook.enabled ? '#10b981' : '#cbd5e1',
                    }}
                  >
                    <span
                      className="absolute top-0.5 rounded-full bg-white shadow-sm transition-[left] duration-200"
                      style={{
                        left: webhook.enabled ? 20 : 2,
                        width: 18,
                        height: 18,
                      }}
                    />
                  </button>

                  {/* Platform Icon */}
                  <span className="flex items-center text-slate-500" title={getPlatformLabel(webhook.type)}>
                    {getPlatformIcon(webhook.type)}
                  </span>

                  {/* Name */}
                  <span className="font-semibold text-sm">{webhook.name}</span>

                  {/* Platform Badge */}
                  <span
                    className="py-0.5 px-2 rounded text-[11px] font-medium text-white"
                    style={{
                      background: webhook.type === 'slack' ? '#4A154B'
                        : webhook.type === 'teams' ? '#464EB8'
                        : '#64748b',
                    }}
                  >
                    {getPlatformLabel(webhook.type)}
                  </span>

                  {/* Status */}
                  {webhook.lastStatus && (
                    <span
                      className="py-0.5 px-2 rounded text-[11px] font-medium"
                      style={{
                        background: webhook.lastStatus === 'success' ? '#dcfce7' : '#fef2f2',
                        color: webhook.lastStatus === 'success' ? '#15803d' : '#dc2626',
                      }}
                    >
                      {webhook.lastStatus === 'success' ? <><Check size={10} className="mr-1" />Success</> : <><X size={10} className="mr-1" />Failed</>}
                    </span>
                  )}

                  <div className="flex-1" />

                  {/* Test Result */}
                  {testResult?.id === webhook.id && (
                    <span className="text-xs inline-flex items-center gap-1" style={{ color: testResult.success ? '#15803d' : '#dc2626' }}>
                      {testResult.success ? <><Check size={12} />Test passed</> : <><X size={12} />{testResult.error || 'Test failed'}</>}
                    </span>
                  )}

                  {/* Actions */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTest(webhook.id)}
                    disabled={testingId === webhook.id}
                  >
                    {testingId === webhook.id ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Testing...</> : <><FlaskConical size={14} className="mr-1.5" />Test</>}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWebhook(webhook.id)}
                    className="text-red-600"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                {/* URL */}
                <div className="text-xs text-slate-500 mb-2">
                  <code className="bg-slate-100 py-0.5 px-1.5 rounded">
                    {webhook.url.length > 60 ? webhook.url.substring(0, 60) + '...' : webhook.url}
                  </code>
                </div>

                {/* Events */}
                <div className="flex gap-1.5 flex-wrap">
                  {webhook.events.map(event => (
                    <span
                      key={event}
                      className="py-0.5 px-2 rounded text-[11px]"
                      style={{ background: '#e0e7ff', color: '#3730a3' }}
                    >
                      {event}
                    </span>
                  ))}
                </div>

                {/* Last Triggered */}
                {webhook.lastTriggered && (
                  <div className="text-[11px] text-slate-400 mt-2">
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
        <h3 className="mt-0 mb-4 text-base font-semibold flex items-center gap-2">
          <BookOpen size={18} />Setup Guides
        </h3>

        <div className="flex flex-col gap-4">
          {/* Slack Setup */}
          <details className="cursor-pointer">
            <summary className="font-medium text-sm py-2 flex items-center gap-2">
              <MessageSquare size={16} />How to set up Slack notifications
            </summary>
            <div className="pl-4 text-sm text-slate-600 leading-relaxed">
              <ol className="my-2 pl-5">
                <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-500">api.slack.com/apps</a></li>
                <li>Create a new app or select an existing one</li>
                <li>Navigate to "Incoming Webhooks" and enable it</li>
                <li>Click "Add New Webhook to Workspace"</li>
                <li>Select the channel where you want notifications</li>
                <li>Copy the webhook URL and paste it above</li>
              </ol>
            </div>
          </details>

          {/* Teams Setup */}
          <details className="cursor-pointer">
            <summary className="font-medium text-sm py-2 flex items-center gap-2">
              <Users size={16} />How to set up Microsoft Teams notifications
            </summary>
            <div className="pl-4 text-sm text-slate-600 leading-relaxed">
              <ol className="my-2 pl-5">
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
          <details className="cursor-pointer">
            <summary className="font-medium text-sm py-2 flex items-center gap-2">
              <Link2 size={16} />Generic webhook payload format
            </summary>
            <div className="pl-4 text-sm">
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg text-xs overflow-auto mt-2">
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
