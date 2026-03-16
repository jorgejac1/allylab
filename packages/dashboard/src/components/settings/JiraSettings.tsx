import { useState } from 'react';
import { Card, Button, Input, Select } from '../ui';
import { useLocalStorage } from '../../hooks';
import { PermissionGuard } from '../guards/RoleGuard';
import type { JiraConfig, JiraFieldMapping } from '../../types';
import { DEFAULT_JIRA_CONFIG, DEFAULT_FIELD_MAPPING } from '../../types/jira';
import { FieldMappingConfig } from './FieldMappingConfig';
import { Link, Globe, Loader2, Plug, Check } from 'lucide-react';

export function JiraSettings() {
  const [config, setConfig] = useLocalStorage<JiraConfig>('allylab_jira_config', DEFAULT_JIRA_CONFIG);
  const [mapping, setMapping] = useLocalStorage<JiraFieldMapping>('allylab_jira_mapping', DEFAULT_FIELD_MAPPING);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleConfigChange = <K extends keyof JiraConfig>(key: K, value: JiraConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.authHeader ? { Authorization: config.authHeader } : {}),
        },
        body: JSON.stringify({
          fields: {
            project: { key: config.projectKey },
            issuetype: { name: config.issueType },
            summary: '[TEST] AllyLab Connection Test',
            description: 'This is a test issue from AllyLab. You can delete this.',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `Connected successfully! Test issue: ${data.key || 'Created'}`,
        });
      } else {
        const data = await response.json();
        setTestResult({
          success: false,
          message: `Error: ${data.errorMessages?.join(', ') || response.statusText}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
  };

  const handleSaveAnimationEnd = () => {
    setSaved(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_JIRA_CONFIG);
    setMapping(DEFAULT_FIELD_MAPPING);
    setSaved(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <style>{`
        @keyframes savedSuccess {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
      {/* Enable/Disable */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold m-0 inline-flex items-center gap-2">
              <Link size={18} /> JIRA Integration
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-0">
              Export accessibility issues directly to your JIRA instance
            </p>
          </div>
          <PermissionGuard permission="jira:connect">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => handleConfigChange('enabled', e.target.checked)}
                className="w-[18px] h-[18px]"
              />
              <span className="text-sm font-medium">
                {config.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </PermissionGuard>
        </div>
      </Card>

      {config.enabled && (
        <>
          {/* Endpoint Configuration */}
          <Card>
            <h3 className="text-base font-semibold mt-0 mb-4 inline-flex items-center gap-2">
              <Globe size={18} /> Endpoint Configuration
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  JIRA API Endpoint
                </label>
                <Input
                  value={config.endpoint}
                  onChange={e => handleConfigChange('endpoint', e.target.value)}
                  placeholder="https://your-domain.atlassian.net/rest/api/2/issue"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your JIRA REST API endpoint or proxy URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Authorization Header (Optional)
                </label>
                <Input
                  value={config.authHeader || ''}
                  onChange={e => handleConfigChange('authHeader', e.target.value)}
                  placeholder="Basic xxx or Bearer xxx"
                  type="password"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty if your proxy handles authentication
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Project Key
                  </label>
                  <Input
                    value={config.projectKey}
                    onChange={e => handleConfigChange('projectKey', e.target.value)}
                    placeholder="A11Y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Issue Type
                  </label>
                  <Select
                    value={config.issueType}
                    onChange={e => handleConfigChange('issueType', e.target.value)}
                    options={[
                      { value: 'Bug', label: 'Bug' },
                      { value: 'Task', label: 'Task' },
                      { value: 'Story', label: 'Story' },
                      { value: 'Sub-task', label: 'Sub-task' },
                    ]}
                  />
                </div>
              </div>

              {/* Test Connection */}
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="secondary"
                  onClick={handleTestConnection}
                  disabled={testing || !config.endpoint}
                  className="inline-flex items-center gap-1.5"
                >
                  {testing ? <><Loader2 size={14} className="animate-spin" /> Testing...</> : <><Plug size={14} /> Test Connection</>}
                </Button>
                {testResult && (
                  <span
                    className="text-sm"
                    style={{ color: testResult.success ? '#10b981' : '#ef4444' }}
                  >
                    {testResult.message}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Field Mapping */}
          <FieldMappingConfig mapping={mapping} onChange={setMapping} />

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5"
              style={saved ? { animation: 'savedSuccess 2s ease-out' } : undefined}
              onAnimationEnd={handleSaveAnimationEnd}
            >
              {saved ? <><Check size={14} /> Saved!</> : 'Save Settings'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
