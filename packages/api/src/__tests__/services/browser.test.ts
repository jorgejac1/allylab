import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Browser } from 'playwright';

// Mock playwright before importing browser module
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

import { chromium } from 'playwright';
import { getBrowser, createPage, closeBrowser } from '../../services/browser';

const mockChromium = vi.mocked(chromium);

/**
 * Mock Page interface for testing
 */
interface MockPage {
  goto: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

/**
 * Mock BrowserContext interface for testing
 */
interface MockBrowserContext {
  newPage: ReturnType<typeof vi.fn>;
}

/**
 * Mock Browser interface for testing
 */
interface MockBrowser {
  isConnected: ReturnType<typeof vi.fn>;
  newContext: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

describe('services/browser', () => {
  let mockBrowser: MockBrowser;
  let mockContext: MockBrowserContext;
  let mockPage: MockPage;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = {
      goto: vi.fn().mockResolvedValue(null),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
    };

    mockBrowser = {
      isConnected: vi.fn().mockReturnValue(true),
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockChromium.launch.mockResolvedValue(mockBrowser as unknown as Browser);
  });

  afterEach(async () => {
    // Reset the module state
    await closeBrowser();
    vi.restoreAllMocks();
  });

  describe('getBrowser', () => {
    it('launches browser with correct options', async () => {
      await getBrowser();

      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    });

    it('returns existing browser if connected', async () => {
      await getBrowser();
      await getBrowser();

      // Should only launch once
      expect(mockChromium.launch).toHaveBeenCalledTimes(1);
    });

    it('launches new browser if previous disconnected', async () => {
      await getBrowser();
      
      // Simulate disconnection
      mockBrowser.isConnected.mockReturnValue(false);
      
      await getBrowser();

      expect(mockChromium.launch).toHaveBeenCalledTimes(2);
    });
  });

  describe('createPage', () => {
    it('creates page with desktop viewport by default', async () => {
      await createPage();

      expect(mockBrowser.newContext).toHaveBeenCalledWith(
        expect.objectContaining({
          viewport: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
          }),
        })
      );
    });

    it('creates page with desktop viewport explicitly', async () => {
      await createPage('desktop');

      expect(mockBrowser.newContext).toHaveBeenCalledWith(
        expect.objectContaining({
          isMobile: false,
        })
      );
    });

    it('creates page with mobile viewport', async () => {
      await createPage('mobile');

      expect(mockBrowser.newContext).toHaveBeenCalledWith(
        expect.objectContaining({
          isMobile: true,
          hasTouch: true,
        })
      );
    });

    it('creates page with tablet viewport', async () => {
      await createPage('tablet');

      expect(mockBrowser.newContext).toHaveBeenCalled();
    });

    it('sets correct user agent for mobile', async () => {
      await createPage('mobile');

      expect(mockBrowser.newContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: expect.stringContaining('Mobile'),
        })
      );
    });

    it('sets correct user agent for desktop', async () => {
      await createPage('desktop');

      expect(mockBrowser.newContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userAgent: expect.stringContaining('AllyLab'),
        })
      );
    });

    it('returns a new page from context', async () => {
      const page = await createPage();

      expect(mockContext.newPage).toHaveBeenCalled();
      expect(page).toBe(mockPage);
    });
  });

  describe('closeBrowser', () => {
    it('closes browser when it exists', async () => {
      await getBrowser();
      await closeBrowser();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('does nothing when no browser exists', async () => {
      // Don't call getBrowser first
      await closeBrowser();

      expect(mockBrowser.close).not.toHaveBeenCalled();
    });

    it('sets browser to null after closing', async () => {
      await getBrowser();
      await closeBrowser();
      
      // Next getBrowser should launch new browser
      await getBrowser();

      expect(mockChromium.launch).toHaveBeenCalledTimes(2);
    });
  });
});