export interface ScanResult {
  url: string;
  timestamp: string;
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  scanTime: number;
  findings: Finding[];
}

export interface Finding {
  ruleId: string;
  ruleTitle: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagTags: string[];
  selector: string;
  html: string;
  helpUrl: string;
}

// Authentication types for scanning protected pages
export interface AuthCookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface StorageState {
  cookies: AuthCookie[];
  origins?: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

export interface ScanAuthOptions {
  cookies?: AuthCookie[];
  headers?: Record<string, string>;
  storageState?: StorageState;
  basicAuth?: { username: string; password: string };
}

export interface SiteScanResult {
  pagesScanned: number;
  averageScore: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  results: PageResult[];
}

export interface PageResult {
  url: string;
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  scanTime: number;
}

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

export async function fetchScan(
  apiUrl: string,
  url: string,
  standard: string,
  viewport: string,
  timeout: number = 60000,
  auth?: ScanAuthOptions
): Promise<ScanResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const body: Record<string, unknown> = { url, standard, viewport };
    if (auth) {
      body.auth = auth;
    }

    const response = await fetch(`${apiUrl}/scan/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchSiteScan(
  apiUrl: string,
  url: string,
  maxPages: number,
  maxDepth: number,
  standard: string,
  onEvent?: (event: SSEEvent) => void
): Promise<SiteScanResult> {
  const response = await fetch(`${apiUrl}/crawl/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, maxPages, maxDepth, standard }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let result: SiteScanResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      
      const lines = chunk.split('\n');
      let eventType = '';
      let dataStr = '';
      
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr = line.slice(5).trim();
        }
      }
      
      if (!eventType || !dataStr) continue;
      
      try {
        const data = JSON.parse(dataStr);
        
        if (onEvent) {
          onEvent({ type: eventType, data });
        }
        
        if (eventType === 'complete') {
          result = data as SiteScanResult;
        }
        
        if (eventType === 'error') {
          throw new Error(data.message || 'Scan failed');
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          // Skip invalid JSON
          continue;
        }
        throw e;
      }
    }
  }

  if (!result) {
    throw new Error('No results received from server');
  }

  return result;
}