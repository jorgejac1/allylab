import { chromium, type Browser, type Page } from 'playwright';
import type { Viewport, ViewportConfig } from '../types/index.js';
import { VIEWPORT_CONFIGS } from '../types/index.js';

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

export async function createPage(viewport: Viewport = 'desktop'): Promise<Page> {
  const browser = await getBrowser();
  const config: ViewportConfig = VIEWPORT_CONFIGS[viewport];
  
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    deviceScaleFactor: config.deviceScaleFactor || 1,
    isMobile: config.isMobile || false,
    hasTouch: config.hasTouch || false,
    userAgent: config.isMobile 
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1 AllyLab/1.0'
      : 'AllyLab/1.0 (Accessibility Scanner)',
  });
  
  return context.newPage();
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Cleanup on exit
process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);