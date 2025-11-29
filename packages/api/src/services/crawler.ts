import { chromium, type Browser, type Page } from "playwright";

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

export async function crawlSite(options: CrawlOptions): Promise<CrawlResult> {
  const {
    startUrl,
    maxPages = 10,
    sameDomainOnly = true,
    maxDepth = 3,
  } = options;

  const startTime = Date.now();
  const visited = new Set<string>();
  const toVisit: Array<{ url: string; depth: number }> = [
    { url: startUrl, depth: 0 },
  ];
  const foundUrls: string[] = [];

  const startDomain = new URL(startUrl).hostname;

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "AllyLab-Crawler/1.0",
    });
    const page = await context.newPage();

    while (toVisit.length > 0 && foundUrls.length < maxPages) {
      const current = toVisit.shift();
      /* c8 ignore next */
      if (!current) break;

      const { url, depth } = current;

      // Normalize URL
      const normalizedUrl = normalizeUrl(url);

      // Skip if already visited
      /* c8 ignore next */
      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      // Skip if max depth reached
      /* c8 ignore next */
      if (depth > maxDepth) continue;

      try {
        // Navigate to page
        const response = await page.goto(normalizedUrl, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        });

        // Skip non-HTML responses
        const contentType = response?.headers()["content-type"] || "";
        if (!contentType.includes("text/html")) continue;

        // Add to found URLs
        foundUrls.push(normalizedUrl);
        console.log(`[Crawler] Found: ${normalizedUrl} (depth: ${depth})`);

        // Extract links if not at max depth
        if (depth < maxDepth) {
          const links = await extractLinks(page, startDomain, sameDomainOnly);

          for (const link of links) {
            if (!visited.has(link) && !toVisit.some((t) => t.url === link)) {
              toVisit.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
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

async function extractLinks(
  page: Page,
  startDomain: string,
  sameDomainOnly: boolean
): Promise<string[]> {
  // Use $$eval which handles browser context properly
  const links = await page.$$eval("a[href]", (anchors) =>
    anchors
      .map((a) => a.getAttribute("href"))
      .filter((href): href is string => href !== null)
  );

  const validLinks: string[] = [];
  const pageUrl = page.url();

  for (const href of links) {
    try {
      // Resolve relative URLs
      const absoluteUrl = new URL(href, pageUrl).toString();
      const urlObj = new URL(absoluteUrl);

      // Skip non-http(s) URLs
      if (!urlObj.protocol.startsWith("http")) continue;

      // Skip fragments, mailto, tel, etc.
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        continue;

      // Check domain if sameDomainOnly
      if (sameDomainOnly && urlObj.hostname !== startDomain) continue;

      // Skip common non-page URLs
      const path = urlObj.pathname.toLowerCase();
      if (
        path.match(
          /\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico|woff|woff2|ttf|eot)$/
        )
      )
        continue;

      validLinks.push(normalizeUrl(absoluteUrl));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.log(`[Crawler] Invalid URL: ${href} - ${message}`);
    }
  }

  return [...new Set(validLinks)];
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.hash = "";
    urlObj.searchParams.delete("utm_source");
    urlObj.searchParams.delete("utm_medium");
    urlObj.searchParams.delete("utm_campaign");

    let normalized = urlObj.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log(`[Crawler] Failed to normalize URL: ${url} - ${message}`);
    return url;
  }
}
