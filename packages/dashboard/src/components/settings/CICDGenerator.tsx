import { useState } from 'react';
import { Card, Button, Input, Select } from '../ui';
import { getScannedUrls } from '../../utils/storage';

type Platform = 'github' | 'gitlab' | 'harness';
type Schedule = 'push' | 'daily' | 'weekly' | 'manual';

interface CICDConfig {
  platform: Platform;
  urls: string[];
  failOnCritical: boolean;
  failOnSerious: boolean;
  uploadArtifacts: boolean;
  schedule: Schedule;
  threshold: number;
}

const PLATFORM_OPTIONS = [
  { value: 'github', label: 'GitHub Actions' },
  { value: 'gitlab', label: 'GitLab CI' },
  { value: 'harness', label: 'Harness Pipeline' },
];

const SCHEDULE_OPTIONS = [
  { value: 'push', label: 'On Push' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'manual', label: 'Manual Only' },
];

function generateGitHubActions(config: CICDConfig): string {
  const schedule = config.schedule === 'daily' 
    ? `\n  schedule:\n    - cron: '0 6 * * *'` 
    : config.schedule === 'weekly'
    ? `\n  schedule:\n    - cron: '0 6 * * 1'`
    : '';
  
  const trigger = config.schedule === 'manual' 
    ? 'workflow_dispatch' 
    : config.schedule === 'push' 
    ? 'push' 
    : 'workflow_dispatch';

  return `name: Accessibility Scan

on:
  ${trigger}:${schedule}

jobs:
  accessibility-scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install chromium
      
      - name: Run Accessibility Scan
        id: scan
        run: |
          URLS="${config.urls.join(' ')}"
          THRESHOLD=${config.threshold}
          FAIL_ON_CRITICAL=${config.failOnCritical}
          FAIL_ON_SERIOUS=${config.failOnSerious}
          
          for url in $URLS; do
            echo "Scanning $url..."
            npx @axe-core/cli "$url" --exit
          done
        continue-on-error: true
      
      ${config.uploadArtifacts ? `- name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-report
          path: accessibility-results/
          retention-days: 30` : ''}
      
      - name: Check Results
        if: steps.scan.outcome == 'failure'
        run: |
          echo "::error::Accessibility scan found issues"
          ${config.failOnCritical ? 'exit 1' : 'echo "Continuing despite issues..."'}
`;
}

function generateGitLabCI(config: CICDConfig): string {
  const schedule = config.schedule === 'daily' 
    ? `\n    - schedules` 
    : config.schedule === 'weekly'
    ? `\n    - schedules`
    : '';

  return `stages:
  - accessibility

accessibility-scan:
  stage: accessibility
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  
  variables:
    URLS: "${config.urls.join(' ')}"
    THRESHOLD: "${config.threshold}"
  
  script:
    - npm ci
    - npx playwright install chromium
    - |
      for url in $URLS; do
        echo "Scanning $url..."
        npx @axe-core/cli "$url" --save accessibility-results/
      done
  
  ${config.uploadArtifacts ? `artifacts:
    paths:
      - accessibility-results/
    expire_in: 30 days
    when: always` : ''}
  
  rules:
    - if: $CI_PIPELINE_SOURCE == "push"${schedule}
    - if: $CI_PIPELINE_SOURCE == "web"
  
  ${config.failOnCritical ? '' : 'allow_failure: true'}
`;
}

function generateHarness(config: CICDConfig): string {
  return `pipeline:
  name: Accessibility Scan
  identifier: accessibility_scan
  projectIdentifier: \${project}
  orgIdentifier: \${org}
  
  stages:
    - stage:
        name: Scan
        identifier: scan
        type: CI
        spec:
          cloneCodebase: true
          infrastructure:
            type: KubernetesDirect
            spec:
              connectorRef: \${k8s_connector}
              namespace: ci
          execution:
            steps:
              - step:
                  type: Run
                  name: Install Dependencies
                  identifier: install
                  spec:
                    connectorRef: \${docker_connector}
                    image: mcr.microsoft.com/playwright:v1.40.0-focal
                    shell: Bash
                    command: |
                      npm ci
                      npx playwright install chromium
              
              - step:
                  type: Run
                  name: Run Accessibility Scan
                  identifier: scan
                  spec:
                    connectorRef: \${docker_connector}
                    image: mcr.microsoft.com/playwright:v1.40.0-focal
                    shell: Bash
                    command: |
                      URLS="${config.urls.join(' ')}"
                      
                      for url in $URLS; do
                        echo "Scanning $url..."
                        npx @axe-core/cli "$url" --save results/
                      done
                    ${config.failOnCritical ? '' : `
                    failureStrategies:
                      - onFailure:
                          action:
                            type: Ignore`}
              
              ${config.uploadArtifacts ? `- step:
                  type: S3Upload
                  name: Upload Results
                  identifier: upload
                  spec:
                    connectorRef: \${aws_connector}
                    bucket: accessibility-reports
                    sourcePath: results/` : ''}
  
  properties:
    ci:
      codebase:
        connectorRef: \${git_connector}
        repoName: \${repo}
        build: <+input>
`;
}

function generateConfig(config: CICDConfig): string {
  switch (config.platform) {
    case 'github':
      return generateGitHubActions(config);
    case 'gitlab':
      return generateGitLabCI(config);
    case 'harness':
      return generateHarness(config);
    default:
      return '';
  }
}

function getFileName(platform: Platform): string {
  switch (platform) {
    case 'github':
      return '.github/workflows/accessibility.yml';
    case 'gitlab':
      return '.gitlab-ci.yml';
    case 'harness':
      return 'harness-pipeline.yaml';
    default:
      return '';
  }
}

export function CICDGenerator() {
  const savedUrls = getScannedUrls();
  
  const [config, setConfig] = useState<CICDConfig>({
    platform: 'github',
    urls: savedUrls.slice(0, 3),
    failOnCritical: true,
    failOnSerious: false,
    uploadArtifacts: true,
    schedule: 'push',
    threshold: 70,
  });
  
  const [urlInput, setUrlInput] = useState('');
  const [copied, setCopied] = useState(false);
  
  const generatedConfig = generateConfig(config);

  const handleAddUrl = () => {
    if (urlInput && !config.urls.includes(urlInput)) {
      setConfig({ ...config, urls: [...config.urls, urlInput] });
      setUrlInput('');
    }
  };

  const handleRemoveUrl = (url: string) => {
    setConfig({ ...config, urls: config.urls.filter(u => u !== url) });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedConfig);
    setCopied(true);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedConfig], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(config.platform).split('/').pop() || 'pipeline.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Configuration */}
      <Card style={{ padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 20px 0' }}>
          🔧 CI/CD Configuration
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Platform */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Platform
            </label>
            <Select
              value={config.platform}
              onChange={(e) => setConfig({ ...config, platform: e.target.value as Platform })}
              options={PLATFORM_OPTIONS}
            />
          </div>

          {/* Schedule */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Schedule
            </label>
            <Select
              value={config.schedule}
              onChange={(e) => setConfig({ ...config, schedule: e.target.value as Schedule })}
              options={SCHEDULE_OPTIONS}
            />
          </div>

          {/* Threshold */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Minimum Score Threshold
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={config.threshold}
              onChange={(e) => setConfig({ ...config, threshold: Number(e.target.value) })}
            />
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.failOnCritical}
                onChange={(e) => setConfig({ ...config, failOnCritical: e.target.checked })}
              />
              <span style={{ fontSize: 14 }}>Fail build on critical issues</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.failOnSerious}
                onChange={(e) => setConfig({ ...config, failOnSerious: e.target.checked })}
              />
              <span style={{ fontSize: 14 }}>Fail build on serious issues</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.uploadArtifacts}
                onChange={(e) => setConfig({ ...config, uploadArtifacts: e.target.checked })}
              />
              <span style={{ fontSize: 14 }}>Upload results as artifact</span>
            </label>
          </div>
        </div>

        {/* URLs */}
        <div style={{ marginTop: 20 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            URLs to Scan
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              placeholder="https://example.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
              style={{ flex: 1 }}
            />
            <Button onClick={handleAddUrl} disabled={!urlInput}>
              Add
            </Button>
          </div>
          
          {config.urls.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {config.urls.map((url) => (
                <div
                  key={url}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    background: '#f1f5f9',
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {url}
                  </span>
                  <button
                    onClick={() => handleRemoveUrl(url)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: 0,
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {savedUrls.length > 0 
                ? `Add URLs or choose from your scanned sites: ${savedUrls.slice(0, 3).map(u => new URL(u).hostname).join(', ')}`
                : 'Add URLs to include in the scan pipeline'
              }
            </p>
          )}
        </div>
      </Card>

      {/* Generated Config */}
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              📄 Generated Configuration
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Save as <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                {getFileName(config.platform)}
              </code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </Button>
            <Button onClick={handleDownload}>
              ⬇️ Download
            </Button>
          </div>
        </div>
        
        <div
          style={{
            background: '#1e293b',
            color: '#e2e8f0',
            padding: 16,
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.6,
            overflow: 'auto',
            maxHeight: 500,
            whiteSpace: 'pre',
          }}
        >
          {generatedConfig}
        </div>
      </Card>
    </div>
  );
}

export default CICDGenerator;
