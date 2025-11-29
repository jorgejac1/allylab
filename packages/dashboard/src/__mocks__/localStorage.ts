/**
 * In-memory localStorage mock
 */
export class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  // Helper methods for testing
  _getStore(): Record<string, string> {
    return { ...this.store };
  }

  _setStore(data: Record<string, string>): void {
    this.store = { ...data };
  }
}

/**
 * Create a fresh localStorage mock
 */
export function createMockLocalStorage(initialData: Record<string, string> = {}) {
  const storage = new MockLocalStorage();
  storage._setStore(initialData);
  return storage;
}

/**
 * Setup localStorage mock on window
 */
export function setupLocalStorageMock(initialData: Record<string, string> = {}) {
  const storage = createMockLocalStorage(initialData);
  Object.defineProperty(window, 'localStorage', { value: storage, writable: true });
  return storage;
}