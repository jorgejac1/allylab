import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Browser } from "playwright";

// Mock playwright
vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

import { chromium } from "playwright";
import { crawlSite } from "../../services/crawler";

const mockChromium = vi.mocked(chromium);

interface MockPage {
  goto: ReturnType<typeof vi.fn>;
  url: ReturnType<typeof vi.fn>;
  $$eval: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

interface MockBrowserContext {
  newPage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

interface MockBrowser {
  newContext: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

describe("services/crawler", () => {
  let mockBrowser: MockBrowser;
  let mockContext: MockBrowserContext;
  let mockPage: MockPage;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = {
      goto: vi.fn(),
      url: vi.fn().mockReturnValue("https://example.com"),
      $$eval: vi.fn().mockResolvedValue([]),
      close: vi.fn(),
    };

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    };

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn(),
    };

    mockChromium.launch.mockResolvedValue(mockBrowser as unknown as Browser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("crawlSite", () => {
    it("crawls starting URL", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls).toContain("https://example.com");
      expect(result.totalFound).toBeGreaterThanOrEqual(1);
    });

    it("respects maxPages limit", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValue([
        "/page1",
        "/page2",
        "/page3",
        "/page4",
        "/page5",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 3,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls.length).toBeLessThanOrEqual(3);
    });

    it("respects maxDepth limit", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 100,
        sameDomainOnly: true,
        maxDepth: 0,
      });

      expect(result.urls).toHaveLength(1);
    });

    it("filters out non-HTML responses", async () => {
      mockPage.goto
        .mockResolvedValueOnce({
          headers: () => ({ "content-type": "text/html" }),
        })
        .mockResolvedValueOnce({
          headers: () => ({ "content-type": "application/pdf" }),
        });

      mockPage.$$eval.mockResolvedValueOnce(["/document.pdf"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls.every((url: string) => !url.endsWith(".pdf"))).toBe(true);
    });

    it("filters external domains when sameDomainOnly is true", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValue([
        "https://external.com/page",
        "/internal-page",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls.every((url: string) => url.includes("example.com"))).toBe(true);
    });

    it("handles navigation errors gracefully", async () => {
      mockPage.goto
        .mockResolvedValueOnce({
          headers: () => ({ "content-type": "text/html" }),
        })
        .mockRejectedValueOnce(new Error("Navigation timeout"));

      mockPage.$$eval.mockResolvedValueOnce(["/broken-page"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls).toContain("https://example.com");
    });

    it("closes browser after crawling", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      await crawlSite({
        startUrl: "https://example.com",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it("returns crawl time", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.crawlTime).toBeGreaterThanOrEqual(0);
    });

    it("normalizes URLs by removing fragments", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValue(["/page#section1", "/page#section2"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      const pageUrls = result.urls.filter((url: string) => url.includes("/page"));
      expect(pageUrls.length).toBeLessThanOrEqual(1);
    });

    it("removes UTM parameters from URLs", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.url.mockReturnValue("https://example.com/page?utm_source=test");

      const result = await crawlSite({
        startUrl: "https://example.com/page?utm_source=test&utm_medium=email",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls[0]).not.toContain("utm_");
    });

    it("skips common non-page file extensions", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValue([
        "/styles.css",
        "/script.js",
        "/image.png",
        "/font.woff2",
        "/valid-page",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      const staticFiles = result.urls.filter((url: string) =>
        /\.(css|js|png|jpg|gif|svg|woff|woff2)$/.test(url)
      );
      expect(staticFiles).toHaveLength(0);
    });

    it("includes external domains when sameDomainOnly is false", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValue([
        "https://external.com/page",
        "/internal-page",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: false,
        maxDepth: 3,
      });

      expect(result.urls.length).toBeGreaterThanOrEqual(1);
    });

    it("handles missing content-type header", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({}),
      });

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls).toHaveLength(0);
      expect(result.totalFound).toBe(0);
    });

    it("handles null response from goto", async () => {
      mockPage.goto.mockResolvedValue(null);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("handles non-Error thrown during navigation", async () => {
      mockPage.goto
        .mockResolvedValueOnce({
          headers: () => ({ "content-type": "text/html" }),
        })
        .mockRejectedValueOnce("string error");

      mockPage.$$eval.mockResolvedValueOnce(["/broken-page"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls).toContain("https://example.com");
    });

    it("skips mailto and tel links", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValue([
        "mailto:test@example.com",
        "tel:+1234567890",
        "#section",
        "/valid-page",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls.every((url: string) => !url.includes("mailto:"))).toBe(true);
      expect(result.urls.every((url: string) => !url.includes("tel:"))).toBe(true);
    });

    it("skips non-http protocols", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValue([
        "ftp://files.example.com/doc.txt",
        "file:///local/file.html",
        "/valid-page",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls.every((url: string) => url.startsWith("http"))).toBe(true);
    });

    it("removes trailing slash from normalized URLs", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.url.mockReturnValue("https://example.com/page/");

      const result = await crawlSite({
        startUrl: "https://example.com/page/",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls[0]).not.toMatch(/\/$/);
    });
  });

  describe("visited and depth control flow", () => {
    it("triggers visited.has continue when same URL queued from different pages", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      // Page 1 and Page 2 both return link to /shared
      // But they're discovered from different parent pages
      mockPage.$$eval
        .mockResolvedValueOnce(["/page-a", "/page-b"])
        .mockResolvedValueOnce(["/shared"])
        .mockResolvedValueOnce(["/shared"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      // /shared should only appear once
      const sharedCount = result.urls.filter((u: string) => u.includes("/shared")).length;
      expect(sharedCount).toBe(1);
    });

    it("triggers depth > maxDepth continue", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval
        .mockResolvedValueOnce(["/depth1-a", "/depth1-b"])
        .mockResolvedValueOnce(["/depth2-a"])
        .mockResolvedValueOnce(["/depth2-b"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 20,
        sameDomainOnly: true,
        maxDepth: 1,  // Only depth 0 and 1 allowed
      });

      expect(result.urls).toContain("https://example.com");
      expect(result.urls.some((u: string) => u.includes("depth1"))).toBe(true);
      expect(result.urls.some((u: string) => u.includes("depth2"))).toBe(false);
    });

    it("handles links already in toVisit queue (deduplication)", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      // Return same link multiple times in same extraction
      mockPage.$$eval.mockResolvedValueOnce([
        "/page1",
        "/page1",
        "/page1",
        "/page2",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      const uniqueUrls = [...new Set(result.urls)];
      expect(result.urls.length).toBe(uniqueUrls.length);
    });

    it("does not extract links when at maxDepth", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      // $$eval should not be called when depth === maxDepth
      mockPage.$$eval.mockResolvedValue(["/should-not-appear"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 0,  // depth 0 === maxDepth 0, so no link extraction
      });

      expect(result.urls).toHaveLength(1);
      expect(result.urls[0]).toBe("https://example.com");
      // $$eval should not have been called since we're at maxDepth
      expect(mockPage.$$eval).not.toHaveBeenCalled();
    });
  });

  describe("extractLinks edge cases", () => {
    it("handles URL parsing errors gracefully", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      // Invalid URL that will throw during new URL()
      mockPage.$$eval.mockResolvedValue([
        "://invalid",
        "http://[::1:80",  // Invalid IPv6
        "/valid-page",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      // Should still work, skipping invalid URLs
      expect(result.urls).toContain("https://example.com");
    });

    it("handles non-Error thrown in URL parsing", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      // These should cause errors in URL constructor
      mockPage.$$eval.mockResolvedValue([
        "not:a:valid:url",
        "/valid",
      ]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("normalizeUrl edge cases", () => {
    it("removes utm_campaign parameter", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.url.mockReturnValue("https://example.com/page?utm_campaign=test");

      const result = await crawlSite({
        startUrl: "https://example.com/page?utm_campaign=summer",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls[0]).not.toContain("utm_campaign");
    });

    it("removes utm_medium parameter", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.url.mockReturnValue("https://example.com/page?utm_medium=email");

      const result = await crawlSite({
        startUrl: "https://example.com/page?utm_medium=email",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls[0]).not.toContain("utm_medium");
    });
  });
});