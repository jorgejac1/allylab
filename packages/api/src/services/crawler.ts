import { chromium, type Browser, type Page } from 'playwright';

export interface CrawlOptions {
  startUrl: string;
  maxPages: number;
  sameDomainOnly: boolean;
  maxDepth: number;
}

export interface CrawlResult {
  urls: string[];
  totalFound: number;
  crawlTime: number;
}

// Exported for testing
export function normalizeUrl(url: string): string {
  const urlObj = new URL(url);
  urlObj.hash = '';
  urlObj.searchParams.delete('utm_source');
  urlObj.searchParams.delete('utm_medium');
  urlObj.searchParams.delete('utm_campaign');

  let normalized = urlObj.toString();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

// Exported for testing
export function isValidLink(href: string): boolean {
  return !href.startsWith('#') && 
         !href.startsWith('mailto:') && 
         !href.startsWith('tel:');
}

// Exported for testing
export function isAllowedProtocol(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

// Exported for testing
export function isStaticFile(pathname: string): boolean {
  return /\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico|woff|woff2|ttf|eot)$/i.test(pathname);
}

// Exported for testing
export function resolveLink(
  href: string,
  pageUrl: string,
  startDomain: string,
  sameDomainOnly: boolean
): string | null {
  if (!isValidLink(href)) {
    return null;
  }

  const absoluteUrl = new URL(href, pageUrl).toString();
  const urlObj = new URL(absoluteUrl);

  if (!isAllowedProtocol(urlObj)) {
    return null;
  }

  if (sameDomainOnly && urlObj.hostname !== startDomain) {
    return null;
  }

  if (isStaticFile(urlObj.pathname)) {
    return null;
  }

  return normalizeUrl(absoluteUrl);
}

// Exported for testing
export function processLinks(
  hrefs: string[],
  pageUrl: string,
  startDomain: string,
  sameDomainOnly: boolean
): string[] {
  const validLinks: string[] = [];

  for (const href of hrefs) {
    try {
      const resolved = resolveLink(href, pageUrl, startDomain, sameDomainOnly);
      if (resolved) {
        validLinks.push(resolved);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[Crawler] Invalid URL: ${href} - ${message}`);
    }
  }

  return [...new Set(validLinks)];
}

async function extractLinks(
  page: Page,
  startDomain: string,
  sameDomainOnly: boolean
): Promise<string[]> {
  /* c8 ignore start */
  const hrefs = await page.$$eval('a[href]', (anchors) =>
    anchors.map((a) => a.getAttribute('href')).filter((href): href is string => href !== null)
  );
  /* c8 ignore stop */

  return processLinks(hrefs, page.url(), startDomain, sameDomainOnly);
}

export async function crawlSite(options: CrawlOptions): Promise<CrawlResult> {
  const { startUrl, maxPages = 10, sameDomainOnly = true, maxDepth = 3 } = options;

  const startTime = Date.now();
  const visited = new Set<string>();
  const toVisit: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const foundUrls: string[] = [];

  const startDomain = new URL(startUrl).hostname;

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'AllyLab-Crawler/1.0',
    });
    const page = await context.newPage();

    while (toVisit.length > 0 && foundUrls.length < maxPages) {
      const current = toVisit.shift()!;
      const { url, depth } = current;

      // Normalize URL
      let normalizedUrl: string;
      try {
        normalizedUrl = normalizeUrl(url);
      } catch {
        console.log(`[Crawler] Failed to normalize URL: ${url}`);
        continue;
      }

      // Skip if already visited
      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      // Skip if max depth exceeded
      if (depth > maxDepth) continue;

      try {
        const response = await page.goto(normalizedUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });

        const contentType = response?.headers()['content-type'] || '';
        if (!contentType.includes('text/html')) continue;

        foundUrls.push(normalizedUrl);
        console.log(`[Crawler] Found: ${normalizedUrl} (depth: ${depth})`);

        if (depth < maxDepth) {
          const links = await extractLinks(page, startDomain, sameDomainOnly);

          for (const link of links) {
            if (!visited.has(link) && !toVisit.some((t) => t.url === link)) {
              toVisit.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[Crawler] Failed to load: ${normalizedUrl} - ${message}`);
      }
    }

    await context.close();
  } finally {
    if (browser) await browser.close();
  }

  return {
    urls: foundUrls,
    totalFound: foundUrls.length,
    crawlTime: Date.now() - startTime,
  };
}