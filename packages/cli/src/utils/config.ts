import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * CLI configuration loaded from file or environment variables
 */
export interface Config {
  apiUrl: string;
  standard: string;
  viewport: string;
  failOn?: string;
  format: string;
  timeout: number;
  ignoreRules: string[];
  output?: string;
  maxPages: number;
  maxDepth: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Config = {
  apiUrl: 'http://localhost:3001',
  standard: 'wcag21aa',
  viewport: 'desktop',
  format: 'pretty',
  timeout: 60000,
  ignoreRules: [],
  maxPages: 10,
  maxDepth: 2,
};

/**
 * Config file names to search for (in order of priority)
 */
const CONFIG_FILES = [
  '.allylabrc.json',
  '.allylabrc',
  'allylab.config.json',
];

/**
 * Find and load config file from current directory or ancestors
 */
function findConfigFile(startDir: string = process.cwd()): string | null {
  let currentDir = startDir;

  while (currentDir !== dirname(currentDir)) {
    for (const filename of CONFIG_FILES) {
      const filepath = resolve(currentDir, filename);
      if (existsSync(filepath)) {
        return filepath;
      }
    }
    currentDir = dirname(currentDir);
  }

  return null;
}

/**
 * Load configuration from file
 */
function loadConfigFile(filepath: string): Partial<Config> {
  try {
    const content = readFileSync(filepath, 'utf-8');
    const config = JSON.parse(content);

    // Normalize ignoreRules
    if (typeof config.ignoreRules === 'string') {
      config.ignoreRules = config.ignoreRules.split(',').map((r: string) => r.trim());
    }

    return config;
  } catch {
    return {};
  }
}

/**
 * Load configuration from environment variables
 */
function loadEnvConfig(): Partial<Config> {
  const config: Partial<Config> = {};

  if (process.env.ALLYLAB_API_URL) {
    config.apiUrl = process.env.ALLYLAB_API_URL;
  }

  if (process.env.ALLYLAB_STANDARD) {
    config.standard = process.env.ALLYLAB_STANDARD;
  }

  if (process.env.ALLYLAB_VIEWPORT) {
    config.viewport = process.env.ALLYLAB_VIEWPORT;
  }

  if (process.env.ALLYLAB_FAIL_ON) {
    config.failOn = process.env.ALLYLAB_FAIL_ON;
  }

  if (process.env.ALLYLAB_FORMAT) {
    config.format = process.env.ALLYLAB_FORMAT;
  }

  if (process.env.ALLYLAB_TIMEOUT) {
    const timeout = parseInt(process.env.ALLYLAB_TIMEOUT, 10);
    if (!isNaN(timeout)) {
      config.timeout = timeout;
    }
  }

  if (process.env.ALLYLAB_IGNORE_RULES) {
    config.ignoreRules = process.env.ALLYLAB_IGNORE_RULES.split(',').map(r => r.trim());
  }

  if (process.env.ALLYLAB_MAX_PAGES) {
    const maxPages = parseInt(process.env.ALLYLAB_MAX_PAGES, 10);
    if (!isNaN(maxPages)) {
      config.maxPages = maxPages;
    }
  }

  if (process.env.ALLYLAB_MAX_DEPTH) {
    const maxDepth = parseInt(process.env.ALLYLAB_MAX_DEPTH, 10);
    if (!isNaN(maxDepth)) {
      config.maxDepth = maxDepth;
    }
  }

  return config;
}

/**
 * Load and merge configuration from all sources
 * Priority: CLI options > Environment variables > Config file > Defaults
 */
export function loadConfig(cliOptions: Partial<Config> = {}): Config {
  // Start with defaults
  let config: Config = { ...DEFAULT_CONFIG };

  // Load from config file
  const configPath = findConfigFile();
  if (configPath) {
    const fileConfig = loadConfigFile(configPath);
    config = { ...config, ...fileConfig };
  }

  // Load from environment variables
  const envConfig = loadEnvConfig();
  config = { ...config, ...envConfig };

  // Apply CLI options (highest priority)
  if (cliOptions.apiUrl !== undefined) config.apiUrl = cliOptions.apiUrl;
  if (cliOptions.standard !== undefined) config.standard = cliOptions.standard;
  if (cliOptions.viewport !== undefined) config.viewport = cliOptions.viewport;
  if (cliOptions.failOn !== undefined) config.failOn = cliOptions.failOn;
  if (cliOptions.format !== undefined) config.format = cliOptions.format;
  if (cliOptions.timeout !== undefined) config.timeout = cliOptions.timeout;
  if (cliOptions.ignoreRules !== undefined) config.ignoreRules = cliOptions.ignoreRules;
  if (cliOptions.output !== undefined) config.output = cliOptions.output;
  if (cliOptions.maxPages !== undefined) config.maxPages = cliOptions.maxPages;
  if (cliOptions.maxDepth !== undefined) config.maxDepth = cliOptions.maxDepth;

  return config;
}

/**
 * Get the path to the loaded config file (for display purposes)
 */
export function getConfigPath(): string | null {
  return findConfigFile();
}

/**
 * Create a sample config file
 */
export function createSampleConfig(): string {
  return JSON.stringify({
    apiUrl: 'http://localhost:3001',
    standard: 'wcag21aa',
    viewport: 'desktop',
    failOn: 'serious',
    format: 'pretty',
    timeout: 60000,
    ignoreRules: [],
    maxPages: 10,
    maxDepth: 2,
  }, null, 2);
}
