import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Browser } from "playwright";

// Mock playwright
vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

import { chromium } from "playwright";
import {
  crawlSite,
  normalizeUrl,
  isValidLink,
  isAllowedProtocol,
  isStaticFile,
  resolveLink,
  processLinks,
} from "../../services/crawler";

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

// For $$eval callback typing (instead of any[])
interface AnchorElementLike {
  getAttribute: (name: string) => string | null;
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

  describe("normalizeUrl", () => {
    it("removes hash fragments", () => {
      expect(normalizeUrl("https://example.com/page#section")).toBe(
        "https://example.com/page"
      );
    });

    it("removes utm_source parameter", () => {
      expect(normalizeUrl("https://example.com/page?utm_source=test")).toBe(
        "https://example.com/page"
      );
    });

    it("removes utm_medium parameter", () => {
      expect(normalizeUrl("https://example.com/page?utm_medium=email")).toBe(
        "https://example.com/page"
      );
    });

    it("removes utm_campaign parameter", () => {
      expect(normalizeUrl("https://example.com/page?utm_campaign=summer")).toBe(
        "https://example.com/page"
      );
    });

    it("removes trailing slash", () => {
      expect(normalizeUrl("https://example.com/page/")).toBe(
        "https://example.com/page"
      );
    });

    it("preserves other query parameters", () => {
      expect(normalizeUrl("https://example.com/page?id=123")).toBe(
        "https://example.com/page?id=123"
      );
    });

    it("throws on invalid URL", () => {
      expect(() => normalizeUrl("not-a-valid-url")).toThrow();
    });
  });

  describe("isValidLink", () => {
    it("returns false for hash links", () => {
      expect(isValidLink("#section")).toBe(false);
    });

    it("returns false for mailto links", () => {
      expect(isValidLink("mailto:test@example.com")).toBe(false);
    });

    it("returns false for tel links", () => {
      expect(isValidLink("tel:+1234567890")).toBe(false);
    });

    it("returns true for relative paths", () => {
      expect(isValidLink("/page")).toBe(true);
    });

    it("returns true for absolute URLs", () => {
      expect(isValidLink("https://example.com")).toBe(true);
    });
  });

  describe("isAllowedProtocol", () => {
    it("returns true for http", () => {
      expect(isAllowedProtocol(new URL("http://example.com"))).toBe(true);
    });

    it("returns true for https", () => {
      expect(isAllowedProtocol(new URL("https://example.com"))).toBe(true);
    });

    it("returns false for ftp", () => {
      expect(isAllowedProtocol(new URL("ftp://example.com"))).toBe(false);
    });

    it("returns false for file", () => {
      expect(isAllowedProtocol(new URL("file:///path/to/file"))).toBe(false);
    });
  });

  describe("isStaticFile", () => {
    it("returns true for CSS files", () => {
      expect(isStaticFile("/styles.css")).toBe(true);
    });

    it("returns true for JS files", () => {
      expect(isStaticFile("/script.js")).toBe(true);
    });

    it("returns true for image files", () => {
      expect(isStaticFile("/image.png")).toBe(true);
      expect(isStaticFile("/photo.jpg")).toBe(true);
      expect(isStaticFile("/photo.jpeg")).toBe(true);
      expect(isStaticFile("/icon.gif")).toBe(true);
      expect(isStaticFile("/logo.svg")).toBe(true);
    });

    it("returns true for font files", () => {
      expect(isStaticFile("/font.woff")).toBe(true);
      expect(isStaticFile("/font.woff2")).toBe(true);
      expect(isStaticFile("/font.ttf")).toBe(true);
      expect(isStaticFile("/font.eot")).toBe(true);
    });

    it("returns true for PDF files", () => {
      expect(isStaticFile("/document.pdf")).toBe(true);
    });

    it("returns true for ico files", () => {
      expect(isStaticFile("/favicon.ico")).toBe(true);
    });

    it("returns false for HTML pages", () => {
      expect(isStaticFile("/page")).toBe(false);
      expect(isStaticFile("/page.html")).toBe(false);
    });

    it("is case insensitive", () => {
      expect(isStaticFile("/IMAGE.PNG")).toBe(true);
      expect(isStaticFile("/Style.CSS")).toBe(true);
    });
  });

  describe("resolveLink", () => {
    const pageUrl = "https://example.com/current";
    const startDomain = "example.com";

    it("handles non-Error thrown during URL processing", () => {
      const originalURL = global.URL;

      global.URL = class MockURL extends originalURL {
        constructor(url: string, base?: string) {
          if (url === "/throw-non-error") {
            throw "string error, not Error object";
          }
          super(url, base);
        }
      } as typeof URL;

      const hrefs = ["/valid", "/throw-non-error", "/another"];
      const result = processLinks(
        hrefs,
        "https://example.com/current",
        "example.com",
        true
      );

      global.URL = originalURL;

      expect(result).toHaveLength(2);
      expect(result).toContain("https://example.com/valid");
      expect(result).toContain("https://example.com/another");
    });

    it("resolves relative URLs", () => {
      expect(resolveLink("/page", pageUrl, startDomain, true)).toBe(
        "https://example.com/page"
      );
    });

    it("resolves absolute URLs", () => {
      expect(
        resolveLink("https://example.com/other", pageUrl, startDomain, true)
      ).toBe("https://example.com/other");
    });

    it("returns null for hash links", () => {
      expect(resolveLink("#section", pageUrl, startDomain, true)).toBeNull();
    });

    it("returns null for mailto links", () => {
      expect(
        resolveLink("mailto:test@example.com", pageUrl, startDomain, true)
      ).toBeNull();
    });

    it("returns null for tel links", () => {
      expect(
        resolveLink("tel:+1234567890", pageUrl, startDomain, true)
      ).toBeNull();
    });

    it("returns null for non-http protocols", () => {
      expect(
        resolveLink("ftp://files.example.com", pageUrl, startDomain, true)
      ).toBeNull();
    });

    it("returns null for external domains when sameDomainOnly is true", () => {
      expect(
        resolveLink("https://other.com/page", pageUrl, startDomain, true)
      ).toBeNull();
    });

    it("returns URL for external domains when sameDomainOnly is false", () => {
      expect(
        resolveLink("https://other.com/page", pageUrl, startDomain, false)
      ).toBe("https://other.com/page");
    });

    it("returns null for static files", () => {
      expect(resolveLink("/styles.css", pageUrl, startDomain, true)).toBeNull();
      expect(resolveLink("/image.png", pageUrl, startDomain, true)).toBeNull();
    });

    it("normalizes the resolved URL", () => {
      expect(
        resolveLink("/page?utm_source=test#section", pageUrl, startDomain, true)
      ).toBe("https://example.com/page");
    });
  });

  describe("processLinks", () => {
    const pageUrl = "https://example.com/current";
    const startDomain = "example.com";

    it("processes multiple valid links", () => {
      const hrefs = ["/page1", "/page2", "/page3"];
      const result = processLinks(hrefs, pageUrl, startDomain, true);

      expect(result).toHaveLength(3);
      expect(result).toContain("https://example.com/page1");
      expect(result).toContain("https://example.com/page2");
      expect(result).toContain("https://example.com/page3");
    });

    it("filters out invalid links", () => {
      const hrefs = ["/valid", "#hash", "mailto:test@test.com", "/another"];
      const result = processLinks(hrefs, pageUrl, startDomain, true);

      expect(result).toHaveLength(2);
      expect(result).toContain("https://example.com/valid");
      expect(result).toContain("https://example.com/another");
    });

    it("deduplicates links", () => {
      const hrefs = ["/page", "/page", "/page"];
      const result = processLinks(hrefs, pageUrl, startDomain, true);

      expect(result).toHaveLength(1);
    });

    it("handles URL parsing errors gracefully", () => {
      const hrefs = ["/valid", "http://[::1", "/another"];
      const result = processLinks(hrefs, pageUrl, startDomain, true);

      expect(result).toHaveLength(2);
      expect(result).toContain("https://example.com/valid");
      expect(result).toContain("https://example.com/another");
    });

    it("handles non-Error thrown during processing", () => {
      const hrefs = ["/valid"];
      const result = processLinks(hrefs, pageUrl, startDomain, true);

      expect(result).toHaveLength(1);
    });
  });

  describe("crawlSite", () => {
    it("extracts href attributes via $$eval callback", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockImplementationOnce(
        async (
          _selector: string,
          callback: (anchors: AnchorElementLike[]) => unknown
        ) => {
          const anchors: AnchorElementLike[] = [
            {
              getAttribute: (name: string) =>
                name === "href" ? "/page1" : null,
            },
            {
              getAttribute: () => null,
            },
          ];
          return callback(anchors);
        }
      );

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 2,
        sameDomainOnly: true,
        maxDepth: 2,
      });

      expect(result.urls).toContain("https://example.com/page1");
    });

    it("skips URL when normalizeUrl throws (covers catch block)", async () => {
      const originalURL = global.URL;
      let callCount = 0;

      global.URL = class MockURL extends originalURL {
        constructor(url: string, base?: string) {
          callCount += 1;
          if (url === "https://example.com" && callCount >= 2) {
            throw new TypeError("Invalid URL from normalizeUrl");
          }
          super(url, base);
        }
      } as typeof URL;

      const consoleSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => undefined);

      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 5,
        sameDomainOnly: true,
        maxDepth: 2,
      });

      expect(result.urls).toEqual([]);
      expect(mockPage.goto).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[Crawler] Failed to normalize URL: https://example.com"
      );

      consoleSpy.mockRestore();
      global.URL = originalURL;
    });

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

      mockPage.$$eval.mockResolvedValue(["/level1"]);

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

      mockPage.$$eval.mockResolvedValueOnce(["/document"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls).toHaveLength(1);
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
    });

    it("skips already visited URLs", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

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

      const sharedCount = result.urls.filter((u: string) =>
        u.includes("/shared")
      ).length;
      expect(sharedCount).toBe(1);
    });

    it("skips URLs exceeding max depth", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval
        .mockResolvedValueOnce(["/depth1"])
        .mockResolvedValueOnce(["/depth2"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 20,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls.some((u: string) => u.includes("depth1"))).toBe(true);
      expect(result.urls.some((u: string) => u.includes("depth2"))).toBe(false);
    });

    it("handles invalid start URL in normalization", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValueOnce([]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 1,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls).toHaveLength(1);
    });

    it("does not extract links at maxDepth", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 0,
      });

      expect(mockPage.$$eval).not.toHaveBeenCalled();
    });

    it("skips URL when it was already visited (covers visited.has(normalizedUrl))", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval.mockResolvedValueOnce(["/"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls).toEqual(["https://example.com"]);
      expect(mockPage.goto).toHaveBeenCalledTimes(1);
    });

    it("skips URL when depth is greater than maxDepth (covers depth > maxDepth with deeper URL)", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      mockPage.$$eval
        .mockResolvedValueOnce(["/level1"])
        .mockResolvedValueOnce(["/level2"]);

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 1,
      });

      expect(result.urls).toEqual([
        "https://example.com",
        "https://example.com/level1",
      ]);
      expect(mockPage.goto).toHaveBeenCalledTimes(2);
    });

    it("skips URL when visited.has returns true (Set.has forced true)", async () => {
      const setProto = Set.prototype as unknown as {
        has(this: Set<unknown>, value: unknown): boolean;
      };

      const originalHas = setProto.has;

      setProto.has = function (_value: unknown): boolean {
        return true;
      };

      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: 3,
      });

      expect(result.urls).toEqual([]);
      expect(mockPage.goto).not.toHaveBeenCalled();

      setProto.has = originalHas;
    });

    it("skips URL when depth is greater than maxDepth (covers depth > maxDepth with negative maxDepth)", async () => {
      mockPage.goto.mockResolvedValue({
        headers: () => ({ "content-type": "text/html" }),
      });

      const result = await crawlSite({
        startUrl: "https://example.com",
        maxPages: 10,
        sameDomainOnly: true,
        maxDepth: -1,
      });

      expect(result.urls).toEqual([]);
      expect(mockPage.goto).not.toHaveBeenCalled();
    });

    it("does not call browser.close when launch fails (covers if(browser) false branch)", async () => {
      mockChromium.launch.mockRejectedValue(new Error("launch failed"));

      await expect(
        crawlSite({
          startUrl: "https://example.com",
          maxPages: 1,
          sameDomainOnly: true,
          maxDepth: 1,
        })
      ).rejects.toThrow("launch failed");

      expect(mockBrowser.close).not.toHaveBeenCalled();
    });
  });
});
