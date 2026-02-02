import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type { Viewport, ViewportConfig, ScanAuthOptions, LoginFlowConfig } from '../types/index.js';
import { VIEWPORT_CONFIGS } from '../types/index.js';
import { browserLogger } from '../utils/logger.js';

// ============================================
// Browser Instance Management
// ============================================

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// ============================================
// Page Pool Configuration
// ============================================

interface PoolConfig {
  maxPages: number;
  pageTimeout: number;  // Max time a page can be in use (ms)
  idleTimeout: number;  // Time before idle page is closed (ms)
}

const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxPages: 10,
  pageTimeout: 30 * 60 * 1000,  // 30 minutes
  idleTimeout: 5 * 60 * 1000,   // 5 minutes
};

// ============================================
// Page Pool Implementation
// ============================================

interface PooledPage {
  page: Page;
  context: BrowserContext;
  viewport: Viewport;
  inUse: boolean;
  createdAt: number;
  lastUsed: number;
  useCount: number;
}

class PagePool {
  private pages: Map<string, PooledPage> = new Map();
  private waitQueue: Array<{
    viewport: Viewport;
    resolve: (page: Page) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private config: PoolConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Acquire a page from the pool
   */
  async acquire(viewport: Viewport = 'desktop', timeout = 60000): Promise<Page> {
    // Try to find an available page with matching viewport
    for (const [, pooled] of this.pages) {
      if (!pooled.inUse && pooled.viewport === viewport) {
        pooled.inUse = true;
        pooled.lastUsed = Date.now();
        pooled.useCount++;
        return pooled.page;
      }
    }

    // Check if we can create a new page
    const activeCount = this.getActiveCount();
    if (activeCount < this.config.maxPages) {
      return this.createPooledPage(viewport);
    }

    // Pool is full, wait for a page to become available
    return this.waitForPage(viewport, timeout);
  }

  /**
   * Release a page back to the pool
   */
  async release(page: Page): Promise<void> {
    for (const [id, pooled] of this.pages) {
      if (pooled.page === page) {
        // Clear page state for reuse
        try {
          await page.evaluate(() => {
            // Clear any state
            if (typeof localStorage !== 'undefined') localStorage.clear();
            if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
          });
          await page.goto('about:blank');
        } catch {
          // Page might be closed, remove from pool
          await this.destroyPage(id);
          return;
        }

        pooled.inUse = false;
        pooled.lastUsed = Date.now();

        // Check if anyone is waiting for a page
        this.processWaitQueue();
        return;
      }
    }
  }

  /**
   * Destroy a page and remove from pool
   */
  async destroy(page: Page): Promise<void> {
    for (const [id, pooled] of this.pages) {
      if (pooled.page === page) {
        await this.destroyPage(id);
        return;
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    active: number;
    idle: number;
    waiting: number;
    maxPages: number;
  } {
    const total = this.pages.size;
    const active = this.getActiveCount();
    return {
      total,
      active,
      idle: total - active,
      waiting: this.waitQueue.length,
      maxPages: this.config.maxPages,
    };
  }

  /**
   * Close all pages and shutdown the pool
   */
  async shutdown(): Promise<void> {
    // Cancel cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Reject all waiting requests
    for (const waiter of this.waitQueue) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool is shutting down'));
    }
    this.waitQueue = [];

    // Close all pages
    const closePromises: Promise<void>[] = [];
    for (const [id] of this.pages) {
      closePromises.push(this.destroyPage(id));
    }
    await Promise.all(closePromises);
  }

  // ============================================
  // Private Methods
  // ============================================

  private async createPooledPage(viewport: Viewport): Promise<Page> {
    const browserInstance = await getBrowser();
    const config: ViewportConfig = VIEWPORT_CONFIGS[viewport];

    const context = await browserInstance.newContext({
      viewport: { width: config.width, height: config.height },
      deviceScaleFactor: config.deviceScaleFactor || 1,
      isMobile: config.isMobile || false,
      hasTouch: config.hasTouch || false,
      userAgent: config.isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1 AllyLab/1.0'
        : 'AllyLab/1.0 (Accessibility Scanner)',
    });

    const page = await context.newPage();
    const id = `page-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    this.pages.set(id, {
      page,
      context,
      viewport,
      inUse: true,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
    });

    return page;
  }

  private async destroyPage(id: string): Promise<void> {
    const pooled = this.pages.get(id);
    if (!pooled) return;

    this.pages.delete(id);

    try {
      await pooled.context.close();
    } catch {
      // Ignore errors during cleanup
    }
  }

  private getActiveCount(): number {
    let count = 0;
    for (const pooled of this.pages.values()) {
      if (pooled.inUse) count++;
    }
    return count;
  }

  private waitForPage(viewport: Viewport, timeout: number): Promise<Page> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        const index = this.waitQueue.findIndex(w => w.timeout === timeoutHandle);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error(`Timeout waiting for page (pool full, max=${this.config.maxPages})`));
      }, timeout);

      this.waitQueue.push({
        viewport,
        resolve,
        reject,
        timeout: timeoutHandle,
      });
    });
  }

  private processWaitQueue(): void {
    if (this.waitQueue.length === 0) return;

    // Find a waiting request we can fulfill
    for (let i = 0; i < this.waitQueue.length; i++) {
      const waiter = this.waitQueue[i];

      // Find an idle page with matching viewport
      for (const [, pooled] of this.pages) {
        if (!pooled.inUse && pooled.viewport === waiter.viewport) {
          this.waitQueue.splice(i, 1);
          clearTimeout(waiter.timeout);

          pooled.inUse = true;
          pooled.lastUsed = Date.now();
          pooled.useCount++;

          waiter.resolve(pooled.page);
          return;
        }
      }

      // Or create a new page if under limit
      if (this.getActiveCount() < this.config.maxPages) {
        this.waitQueue.splice(i, 1);
        clearTimeout(waiter.timeout);

        this.createPooledPage(waiter.viewport)
          .then(waiter.resolve)
          .catch(waiter.reject);
        return;
      }
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdlePages();
    }, 60000); // Check every minute
  }

  private async cleanupIdlePages(): Promise<void> {
    const now = Date.now();

    for (const [id, pooled] of this.pages) {
      // Skip pages in use
      if (pooled.inUse) {
        // Check for stuck pages (exceeded timeout)
        if (now - pooled.lastUsed > this.config.pageTimeout) {
          browserLogger.warn({ msg: 'Page exceeded timeout, destroying', pageId: id });
          await this.destroyPage(id);
        }
        continue;
      }

      // Close idle pages
      if (now - pooled.lastUsed > this.config.idleTimeout) {
        await this.destroyPage(id);
      }
    }
  }
}

// ============================================
// Authenticated Context Support
// ============================================

export interface AuthenticatedContextResult {
  page: Page;
  context: BrowserContext;
}

/**
 * Create an authenticated browser context (not from pool)
 * Used for scanning pages that require login
 */
export async function createAuthenticatedContext(
  viewport: Viewport,
  authOptions: ScanAuthOptions
): Promise<AuthenticatedContextResult> {
  const browserInstance = await getBrowser();
  const viewportConfig: ViewportConfig = VIEWPORT_CONFIGS[viewport];

  // Build context options
  const contextOptions: Parameters<Browser['newContext']>[0] = {
    viewport: { width: viewportConfig.width, height: viewportConfig.height },
    deviceScaleFactor: viewportConfig.deviceScaleFactor || 1,
    isMobile: viewportConfig.isMobile || false,
    hasTouch: viewportConfig.hasTouch || false,
    userAgent: viewportConfig.isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1 AllyLab/1.0'
      : 'AllyLab/1.0 (Accessibility Scanner)',
  };

  // Add storage state if provided (includes cookies and localStorage)
  if (authOptions.storageState) {
    contextOptions.storageState = {
      cookies: authOptions.storageState.cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        expires: c.expires || -1,
        httpOnly: c.httpOnly ?? false,
        secure: c.secure ?? false,
        sameSite: c.sameSite || 'Lax',
      })),
      origins: authOptions.storageState.origins || [],
    };
  }

  // Add HTTP credentials for basic auth
  if (authOptions.basicAuth) {
    contextOptions.httpCredentials = {
      username: authOptions.basicAuth.username,
      password: authOptions.basicAuth.password,
    };
  }

  const context = await browserInstance.newContext(contextOptions);

  // Add cookies if provided (and not already in storage state)
  if (authOptions.cookies && !authOptions.storageState) {
    await context.addCookies(
      authOptions.cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        expires: c.expires || -1,
        httpOnly: c.httpOnly ?? false,
        secure: c.secure ?? false,
        sameSite: (c.sameSite || 'Lax') as 'Strict' | 'Lax' | 'None',
      }))
    );
  }

  // Add custom headers if provided
  if (authOptions.headers) {
    await context.setExtraHTTPHeaders(authOptions.headers);
  }

  const page = await context.newPage();

  browserLogger.info({
    msg: 'Created authenticated context',
    viewport,
    hasStorageState: !!authOptions.storageState,
    hasCookies: !!authOptions.cookies,
    hasHeaders: !!authOptions.headers,
    hasBasicAuth: !!authOptions.basicAuth,
    hasLoginFlow: !!authOptions.loginFlow,
  });

  return { page, context };
}

/**
 * Execute a login flow on a page
 * Returns true if login was successful, false otherwise
 */
export async function executeLoginFlow(
  page: Page,
  loginFlow: LoginFlowConfig
): Promise<boolean> {
  browserLogger.info({
    msg: 'Executing login flow',
    loginUrl: loginFlow.loginUrl,
    stepsCount: loginFlow.steps.length,
  });

  try {
    for (const step of loginFlow.steps) {
      browserLogger.debug({ msg: 'Executing step', action: step.action, selector: step.selector });

      switch (step.action) {
        case 'goto':
          if (!step.url) throw new Error('goto step requires url');
          await page.goto(step.url, { waitUntil: 'domcontentloaded', timeout: step.timeout || 30000 });
          break;

        case 'fill':
          if (!step.selector || step.value === undefined) throw new Error('fill step requires selector and value');
          await page.fill(step.selector, step.value, { timeout: step.timeout || 10000 });
          break;

        case 'click':
          if (!step.selector) throw new Error('click step requires selector');
          await page.click(step.selector, { timeout: step.timeout || 10000 });
          break;

        case 'wait':
          await page.waitForTimeout(step.timeout || 1000);
          break;

        case 'waitForNavigation':
          await page.waitForNavigation({ timeout: step.timeout || 30000 });
          break;

        default:
          browserLogger.warn({ msg: 'Unknown step action', action: step.action });
      }
    }

    // Verify login success
    const { type, value } = loginFlow.successIndicator;
    let success = false;

    switch (type) {
      case 'url-contains':
        success = page.url().includes(value);
        break;

      case 'selector-exists':
        success = !!(await page.$(value));
        break;

      case 'cookie-exists': {
        const cookies = await page.context().cookies();
        success = cookies.some(c => c.name === value);
        break;
      }
    }

    browserLogger.info({
      msg: 'Login flow completed',
      success,
      indicatorType: type,
      currentUrl: page.url(),
    });

    return success;
  } catch (error) {
    browserLogger.error({
      msg: 'Login flow failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Close an authenticated context (cleanup after scan)
 */
export async function closeAuthenticatedContext(context: BrowserContext): Promise<void> {
  try {
    await context.close();
    browserLogger.debug({ msg: 'Closed authenticated context' });
  } catch (error) {
    browserLogger.warn({
      msg: 'Error closing authenticated context',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================
// Global Pool Instance
// ============================================

const pagePool = new PagePool();

/**
 * Acquire a page from the pool
 */
export async function acquirePage(viewport: Viewport = 'desktop', timeout?: number): Promise<Page> {
  return pagePool.acquire(viewport, timeout);
}

/**
 * Release a page back to the pool
 */
export async function releasePage(page: Page): Promise<void> {
  return pagePool.release(page);
}

/**
 * Destroy a page (for error cases)
 */
export async function destroyPage(page: Page): Promise<void> {
  return pagePool.destroy(page);
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  return pagePool.getStats();
}

/**
 * Shutdown the pool
 */
export async function shutdownPool(): Promise<void> {
  await pagePool.shutdown();
}

// ============================================
// Legacy API (for backwards compatibility)
// ============================================

/**
 * @deprecated Use acquirePage() and releasePage() instead
 */
export async function createPage(viewport: Viewport = 'desktop'): Promise<Page> {
  return acquirePage(viewport);
}

// NOTE: Signal handlers for cleanup are managed in server.ts
// to ensure coordinated graceful shutdown of all resources.
