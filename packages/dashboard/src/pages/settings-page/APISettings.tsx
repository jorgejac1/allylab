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
    <div className="flex flex-col gap-6">
      {/* API Endpoint */}
      <Card>
        <h3 className="text-base font-semibold m-0 mb-4">
          API Configuration
        </h3>

        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="api-base-url"
              className="block text-sm font-medium mb-1.5"
            >
              API Base URL
            </label>
            <div className="flex gap-2">
              <Input
                id="api-base-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={() => setApiUrl('http://localhost:3001')}
              >
                Reset
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              The URL where your AllyLab API is running
            </p>
          </div>
        </div>
      </Card>

      {/* API Endpoints Reference */}
      <Card>
        <h3 className="text-base font-semibold m-0 mb-4 flex items-center gap-2">
          <BookOpen size={18} aria-hidden="true" />
          API Endpoints
        </h3>

        <div className="flex flex-col gap-3">
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
          <p className="text-xs text-emerald-500 mt-3 flex items-center gap-1">
            <Check size={14} aria-hidden="true" />
            Copied to clipboard!
          </p>
        )}
      </Card>

      {/* Example Request */}
      <Card>
        <h3 className="text-base font-semibold m-0 mb-4 flex items-center gap-2">
          <Lightbulb size={18} aria-hidden="true" />
          Example Request
        </h3>

        <div className="bg-slate-800 text-slate-200 p-4 rounded-lg font-mono text-sm leading-relaxed overflow-auto">
          <pre className="m-0">
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
          className="mt-3"
        >
          <Clipboard size={14} aria-hidden="true" className="mr-1.5" />
          Copy cURL
        </Button>
      </Card>
    </div>
  );
}
