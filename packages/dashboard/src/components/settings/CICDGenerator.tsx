import { useState } from 'react';
import { Card, Button, Input, Select } from '../ui';
import { getScannedUrls } from '../../utils/storage';
import { Settings, FileText, Clipboard, Check, Download } from 'lucide-react';

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
    <div className="flex flex-col gap-6">
      {/* Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mt-0 mb-5 flex items-center gap-2">
          <Settings size={20} />CI/CD Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Platform */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
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
            <label className="block text-sm font-medium mb-1.5">
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
            <label className="block text-sm font-medium mb-1.5">
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
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.failOnCritical}
                onChange={(e) => setConfig({ ...config, failOnCritical: e.target.checked })}
              />
              <span className="text-sm">Fail build on critical issues</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.failOnSerious}
                onChange={(e) => setConfig({ ...config, failOnSerious: e.target.checked })}
              />
              <span className="text-sm">Fail build on serious issues</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.uploadArtifacts}
                onChange={(e) => setConfig({ ...config, uploadArtifacts: e.target.checked })}
              />
              <span className="text-sm">Upload results as artifact</span>
            </label>
          </div>
        </div>

        {/* URLs */}
        <div className="mt-5">
          <label className="block text-sm font-medium mb-1.5">
            URLs to Scan
          </label>
          <div className="flex gap-2 mb-3">
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
            <div className="flex flex-wrap gap-2">
              {config.urls.map((url) => (
                <div
                  key={url}
                  className="flex items-center gap-2 py-1.5 px-3 bg-slate-100 rounded-md text-sm"
                >
                  <span className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {url}
                  </span>
                  <button
                    onClick={() => handleRemoveUrl(url)}
                    className="bg-transparent border-none cursor-pointer text-slate-500 p-0 text-base"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 m-0">
              {savedUrls.length > 0
                ? `Add URLs or choose from your scanned sites: ${savedUrls.slice(0, 3).map(u => new URL(u).hostname).join(', ')}`
                : 'Add URLs to include in the scan pipeline'
              }
            </p>
          )}
        </div>
      </Card>

      {/* Generated Config */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold m-0 flex items-center gap-2">
              <FileText size={20} />Generated Configuration
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-0">
              Save as <code className="bg-slate-100 py-0.5 px-1.5 rounded">
                {getFileName(config.platform)}
              </code>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? <><Check size={14} className="mr-1.5" />Copied!</> : <><Clipboard size={14} className="mr-1.5" />Copy</>}
            </Button>
            <Button onClick={handleDownload}>
              <Download size={14} className="mr-1.5" />Download
            </Button>
          </div>
        </div>

        <div className="bg-slate-800 text-slate-200 p-4 rounded-lg font-mono text-sm leading-relaxed overflow-auto max-h-[500px] whitespace-pre">
          {generatedConfig}
        </div>
      </Card>
    </div>
  );
}

export default CICDGenerator;
