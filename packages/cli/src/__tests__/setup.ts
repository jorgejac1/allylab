import { vi, afterEach } from 'vitest';

// Mock console for cleaner test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});