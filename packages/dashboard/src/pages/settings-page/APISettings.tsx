import { useState } from 'react';
import { BookOpen, Lightbulb, Clipboard, Check } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { useLocalStorage, useToast } from '../../hooks';
import { EndpointRow } from './EndpointRow';

export function APISettings() {
  const [apiUrl, setApiUrl] = useLocalStorage(
    'allylab_api_url',
    'http://localhost:3001'
  );
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    success('Copied to clipboard');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* API Endpoint */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          API Configuration
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="api-base-url"
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              API Base URL
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                id="api-base-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3001"
                style={{ flex: 1 }}
              />
              <Button
                variant="secondary"
                onClick={() => setApiUrl('http://localhost:3001')}
              >
                Reset
              </Button>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              The URL where your AllyLab API is running
            </p>
          </div>
        </div>
      </Card>

      {/* API Endpoints Reference */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} aria-hidden="true" />
          API Endpoints
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <EndpointRow
            method="GET"
            path="/health"
            description="Health check endpoint"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/scan"
            description="Start an accessibility scan (SSE)"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/scan/json"
            description="Start scan and return JSON result"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/fixes/generate"
            description="Generate AI-powered fix"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="GET"
            path="/github/status"
            description="Check GitHub connection"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/github/pr"
            description="Create a Pull Request with fixes"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="GET"
            path="/rules"
            description="List all custom rules"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/rules"
            description="Create a custom rule"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/trends"
            description="Get score trends over time"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="GET"
            path="/webhooks"
            description="List all webhooks"
            onCopy={handleCopy}
          />
          <EndpointRow
            method="POST"
            path="/webhooks"
            description="Create a new webhook"
            onCopy={handleCopy}
          />
        </div>

        {copied && (
          <p style={{ fontSize: 12, color: '#10b981', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={14} aria-hidden="true" />
            Copied to clipboard!
          </p>
        )}
      </Card>

      {/* Example Request */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lightbulb size={18} aria-hidden="true" />
          Example Request
        </h3>

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
          }}
        >
          <pre style={{ margin: 0 }}>
            {`curl -X POST ${apiUrl}/scan/json \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "standard": "wcag21aa",
    "viewport": "desktop"
  }'`}
          </pre>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            handleCopy(
              `curl -X POST ${apiUrl}/scan/json -H "Content-Type: application/json" -d '{"url": "https://example.com", "standard": "wcag21aa", "viewport": "desktop"}'`
            )
          }
          style={{ marginTop: 12 }}
        >
          <Clipboard size={14} aria-hidden="true" style={{ marginRight: 6 }} />
          Copy cURL
        </Button>
      </Card>
    </div>
  );
}
