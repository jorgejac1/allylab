import type { PathLike } from "fs";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JsonStorage } from "../../utils/storage";

// Mock the fs module
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Import mocked fs after vi.mock
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

// Type the mocks
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockExistsSync = vi.mocked(existsSync);
const mockMkdirSync = vi.mocked(mkdirSync);

interface TestItem {
  id: string;
  name: string;
  value: number;
}

describe("utils/storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: directory exists, file does not
    mockExistsSync.mockImplementation((path: PathLike) => {
      const pathStr = path.toString();
      if (pathStr.endsWith("data")) return true; // directory exists
      return false; // file does not exist
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("creates directory if it does not exist", () => {
      mockExistsSync.mockReturnValue(false);

      new JsonStorage<TestItem>({ filename: "test.json" });

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining("data"),
        { recursive: true }
      );
    });

    it("does not create directory if it already exists", () => {
      mockExistsSync.mockReturnValue(true);

      new JsonStorage<TestItem>({ filename: "test.json" });

      expect(mockMkdirSync).not.toHaveBeenCalled();
    });

    it("uses custom directory when provided", () => {
      mockExistsSync.mockReturnValue(false);

      new JsonStorage<TestItem>({
        filename: "test.json",
        directory: "/custom/path",
      });

      expect(mockMkdirSync).toHaveBeenCalledWith("/custom/path", {
        recursive: true,
      });
    });
  });

  describe("get", () => {
    it("returns undefined for non-existent item", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      const result = storage.get("non-existent");

      expect(result).toBeUndefined();
    });

    it("returns item if it exists", () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = storage.get("1");

      expect(result).toEqual({ id: "1", name: "Test", value: 100 });
    });

    it("loads data only once (caching)", () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      storage.get("1");
      storage.get("1");
      storage.get("2");

      // readFileSync should only be called once due to caching
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAll", () => {
    it("returns empty array when no data", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      const result = storage.getAll();

      expect(result).toEqual([]);
    });

    it("returns all items", () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
      ];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = storage.getAll();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: "1", name: "First", value: 100 });
      expect(result).toContainEqual({ id: "2", name: "Second", value: 200 });
    });
  });

  describe("set", () => {
    it("adds new item and saves to file", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const item: TestItem = { id: "1", name: "New Item", value: 50 };

      storage.set("1", item);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test.json"),
        expect.stringContaining('"id": "1"'),
        "utf-8"
      );
    });

    it("updates existing item", () => {
      const testData: TestItem[] = [{ id: "1", name: "Original", value: 100 }];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      storage.set("1", { id: "1", name: "Updated", value: 200 });

      const result = storage.get("1");
      expect(result?.name).toBe("Updated");
      expect(result?.value).toBe(200);
    });

    it("preserves other items when updating", () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
      ];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      storage.set("1", { id: "1", name: "Updated First", value: 150 });

      expect(storage.get("2")).toEqual({ id: "2", name: "Second", value: 200 });
    });
  });

  describe("delete", () => {
    it("returns false when item does not exist", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      const result = storage.delete("non-existent");

      expect(result).toBe(false);
    });

    it("returns true and removes item when it exists", () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = storage.delete("1");

      expect(result).toBe(true);
      expect(storage.get("1")).toBeUndefined();
    });

    it("saves after successful delete", () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      mockWriteFileSync.mockClear(); // Clear calls from load

      storage.delete("1");

      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it("does not save when delete fails", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      mockWriteFileSync.mockClear();

      storage.delete("non-existent");

      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });
  });

  describe("has", () => {
    it("returns false for non-existent item", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(storage.has("non-existent")).toBe(false);
    });

    it("returns true for existing item", () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(storage.has("1")).toBe(true);
    });
  });

  describe("size", () => {
    it("returns 0 for empty storage", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(storage.size()).toBe(0);
    });

    it("returns correct count", () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
        { id: "3", name: "Third", value: 300 },
      ];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(storage.size()).toBe(3);
    });
  });

  describe("clear", () => {
    it("removes all items", () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
      ];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(storage.size()).toBe(2);
      storage.clear();
      expect(mockWriteFileSync).toHaveBeenLastCalledWith(
        expect.stringContaining("test.json"),
        "[]",
        "utf-8"
      );
    });

    it("saves empty array to file", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      mockWriteFileSync.mockClear();

      storage.clear();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test.json"),
        "[]",
        "utf-8"
      );
    });
  });

  describe("import", () => {
    it("imports items without replacing existing", () => {
      const existingData: TestItem[] = [
        { id: "1", name: "Existing", value: 100 },
      ];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const newItems: TestItem[] = [{ id: "2", name: "New", value: 200 }];

      const imported = storage.import(newItems);

      expect(imported).toBe(1);
      expect(storage.size()).toBe(2);
      expect(storage.get("1")).toBeDefined();
      expect(storage.get("2")).toBeDefined();
    });

    it("replaces all data when replace=true", () => {
      const existingData: TestItem[] = [
        { id: "1", name: "Existing", value: 100 },
      ];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const newItems: TestItem[] = [{ id: "2", name: "New", value: 200 }];

      const imported = storage.import(newItems, true);

      expect(imported).toBe(1);
      expect(storage.size()).toBe(1);
      expect(storage.get("1")).toBeUndefined();
      expect(storage.get("2")).toBeDefined();
    });

    it("overwrites existing items with same id", () => {
      const existingData: TestItem[] = [
        { id: "1", name: "Existing", value: 100 },
      ];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(existingData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const newItems: TestItem[] = [{ id: "1", name: "Updated", value: 999 }];

      storage.import(newItems);

      expect(storage.get("1")?.name).toBe("Updated");
      expect(storage.get("1")?.value).toBe(999);
    });

    it("skips items without id", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const items = [
        { id: "1", name: "Valid", value: 100 },
        { id: "", name: "No ID", value: 200 },
        { name: "Missing ID", value: 300 } as TestItem,
      ];

      const imported = storage.import(items);

      expect(imported).toBe(1);
      expect(storage.size()).toBe(1);
    });

    it("saves after import", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      mockWriteFileSync.mockClear();

      storage.import([{ id: "1", name: "Test", value: 100 }]);

      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it("returns count of imported items", () => {
      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const items: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
        { id: "3", name: "Third", value: 300 },
      ];

      const imported = storage.import(items);

      expect(imported).toBe(3);
    });
  });

  describe("error handling", () => {
    it("handles invalid JSON gracefully", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("not valid json");

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      // Should not throw, should return empty
      expect(storage.getAll()).toEqual([]);
    });

    it("handles read errors gracefully", () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error("Read error");
      });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      // Should not throw, should return empty
      expect(storage.getAll()).toEqual([]);
    });

    it("handles write errors gracefully", () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error("Write error");
      });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      // Should not throw
      expect(() =>
        storage.set("1", { id: "1", name: "Test", value: 100 })
      ).not.toThrow();
    });
  });
});
