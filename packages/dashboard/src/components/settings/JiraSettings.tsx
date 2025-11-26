import { useState } from 'react';
import { Card, Button, Input, Select } from '../ui';
import { useLocalStorage } from '../../hooks';
import type { JiraConfig, JiraFieldMapping } from '../../types';
import { DEFAULT_JIRA_CONFIG, DEFAULT_FIELD_MAPPING } from '../../types/jira';
import { FieldMappingConfig } from './FieldMappingConfig';

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
          message: `✓ Connected successfully! Test issue: ${data.key || 'Created'}`,
        });
      } else {
        const data = await response.json();
        setTestResult({
          success: false,
          message: `✗ Error: ${data.errorMessages?.join(', ') || response.statusText}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `✗ Network error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig(DEFAULT_JIRA_CONFIG);
    setMapping(DEFAULT_FIELD_MAPPING);
    setSaved(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Enable/Disable */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              🔗 JIRA Integration
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Export accessibility issues directly to your JIRA instance
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => handleConfigChange('enabled', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {config.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </Card>

      {config.enabled && (
        <>
          {/* Endpoint Configuration */}
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
              🌐 Endpoint Configuration
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  JIRA API Endpoint
                </label>
                <Input
                  value={config.endpoint}
                  onChange={e => handleConfigChange('endpoint', e.target.value)}
                  placeholder="https://your-domain.atlassian.net/rest/api/2/issue"
                />
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Your JIRA REST API endpoint or proxy URL
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Authorization Header (Optional)
                </label>
                <Input
                  value={config.authHeader || ''}
                  onChange={e => handleConfigChange('authHeader', e.target.value)}
                  placeholder="Basic xxx or Bearer xxx"
                  type="password"
                />
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Leave empty if your proxy handles authentication
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                    Project Key
                  </label>
                  <Input
                    value={config.projectKey}
                    onChange={e => handleConfigChange('projectKey', e.target.value)}
                    placeholder="A11Y"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <Button
                  variant="secondary"
                  onClick={handleTestConnection}
                  disabled={testing || !config.endpoint}
                >
                  {testing ? '⏳ Testing...' : '🔌 Test Connection'}
                </Button>
                {testResult && (
                  <span
                    style={{
                      fontSize: 13,
                      color: testResult.success ? '#10b981' : '#ef4444',
                    }}
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
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>
              {saved ? '✓ Saved!' : 'Save Settings'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}