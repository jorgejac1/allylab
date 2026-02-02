import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JsonStorage } from "../../utils/storage";

// Mock the fs/promises module
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn(),
}));

// Import mocked fs/promises after vi.mock
import { readFile, writeFile, access, mkdir } from "fs/promises";

// Type the mocks
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockAccess = vi.mocked(access);
const mockMkdir = vi.mocked(mkdir);

interface TestItem {
  id: string;
  name: string;
  value: number;
}

describe("utils/storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: directory exists, file does not
    mockAccess.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("creates directory if it does not exist", async () => {
      mockAccess.mockRejectedValue(new Error("ENOENT"));

      new JsonStorage<TestItem>({ filename: "test.json" });

      // Wait for async ensureDir
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining("data"),
        { recursive: true }
      );
    });

    it("does not create directory if it already exists", async () => {
      mockAccess.mockResolvedValue(undefined);

      new JsonStorage<TestItem>({ filename: "test.json" });

      // Wait for async ensureDir
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it("uses custom directory when provided", async () => {
      mockAccess.mockRejectedValue(new Error("ENOENT"));

      new JsonStorage<TestItem>({
        filename: "test.json",
        directory: "/custom/path",
      });

      // Wait for async ensureDir
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockMkdir).toHaveBeenCalledWith("/custom/path", {
        recursive: true,
      });
    });
  });

  describe("get", () => {
    it("returns undefined for non-existent item", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = await storage.get("non-existent");

      expect(result).toBeUndefined();
    });

    it("returns item if it exists", async () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = await storage.get("1");

      expect(result).toEqual({ id: "1", name: "Test", value: 100 });
    });

    it("loads data only once (caching)", async () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      await storage.get("1");
      await storage.get("1");
      await storage.get("2");

      // readFile should only be called once due to caching
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAll", () => {
    it("returns empty array when no data", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = await storage.getAll();

      expect(result).toEqual([]);
    });

    it("returns all items", async () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
      ];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = await storage.getAll();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: "1", name: "First", value: 100 });
      expect(result).toContainEqual({ id: "2", name: "Second", value: 200 });
    });
  });

  describe("set", () => {
    it("adds new item and schedules save", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({
        filename: "test.json",
        writeDebounce: 10,
      });
      const item: TestItem = { id: "1", name: "New Item", value: 50 };

      await storage.set("1", item);
      await storage.flush();

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining("test.json"),
        expect.stringContaining('"id": "1"'),
        "utf-8"
      );
    });

    it("updates existing item", async () => {
      const testData: TestItem[] = [{ id: "1", name: "Original", value: 100 }];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      await storage.set("1", { id: "1", name: "Updated", value: 200 });

      const result = await storage.get("1");
      expect(result?.name).toBe("Updated");
      expect(result?.value).toBe(200);
    });

    it("preserves other items when updating", async () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
      ];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      await storage.set("1", { id: "1", name: "Updated First", value: 150 });

      expect(await storage.get("2")).toEqual({
        id: "2",
        name: "Second",
        value: 200,
      });
    });
  });

  describe("delete", () => {
    it("returns false when item does not exist", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = await storage.delete("non-existent");

      expect(result).toBe(false);
    });

    it("returns true and removes item when it exists", async () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const result = await storage.delete("1");

      expect(result).toBe(true);
      expect(await storage.get("1")).toBeUndefined();
    });

    it("schedules save after successful delete", async () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({
        filename: "test.json",
        writeDebounce: 10,
      });

      // Trigger load
      await storage.getAll();
      mockWriteFile.mockClear();

      await storage.delete("1");
      await storage.flush();

      expect(mockWriteFile).toHaveBeenCalled();
    });

    it("does not save when delete fails", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({
        filename: "test.json",
        writeDebounce: 10,
      });
      mockWriteFile.mockClear();

      await storage.delete("non-existent");
      await storage.flush();

      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe("has", () => {
    it("returns false for non-existent item", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(await storage.has("non-existent")).toBe(false);
    });

    it("returns true for existing item", async () => {
      const testData: TestItem[] = [{ id: "1", name: "Test", value: 100 }];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(await storage.has("1")).toBe(true);
    });
  });

  describe("size", () => {
    it("returns 0 for empty storage", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(await storage.size()).toBe(0);
    });

    it("returns correct count", async () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
        { id: "3", name: "Third", value: 300 },
      ];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      expect(await storage.size()).toBe(3);
    });
  });

  describe("clear", () => {
    it("removes all items", async () => {
      const testData: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
      ];
      mockReadFile.mockResolvedValue(JSON.stringify(testData));

      const storage = new JsonStorage<TestItem>({
        filename: "test.json",
        writeDebounce: 10,
      });

      expect(await storage.size()).toBe(2);
      await storage.clear();
      await storage.flush();

      expect(mockWriteFile).toHaveBeenLastCalledWith(
        expect.stringContaining("test.json"),
        "[]",
        "utf-8"
      );
    });
  });

  describe("import", () => {
    it("imports items without replacing existing", async () => {
      const existingData: TestItem[] = [
        { id: "1", name: "Existing", value: 100 },
      ];
      mockReadFile.mockResolvedValue(JSON.stringify(existingData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const newItems: TestItem[] = [{ id: "2", name: "New", value: 200 }];

      const imported = await storage.import(newItems);

      expect(imported).toBe(1);
      expect(await storage.size()).toBe(2);
      expect(await storage.get("1")).toBeDefined();
      expect(await storage.get("2")).toBeDefined();
    });

    it("replaces all data when replace=true", async () => {
      const existingData: TestItem[] = [
        { id: "1", name: "Existing", value: 100 },
      ];
      mockReadFile.mockResolvedValue(JSON.stringify(existingData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const newItems: TestItem[] = [{ id: "2", name: "New", value: 200 }];

      const imported = await storage.import(newItems, true);

      expect(imported).toBe(1);
      expect(await storage.size()).toBe(1);
      expect(await storage.get("1")).toBeUndefined();
      expect(await storage.get("2")).toBeDefined();
    });

    it("overwrites existing items with same id", async () => {
      const existingData: TestItem[] = [
        { id: "1", name: "Existing", value: 100 },
      ];
      mockReadFile.mockResolvedValue(JSON.stringify(existingData));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const newItems: TestItem[] = [{ id: "1", name: "Updated", value: 999 }];

      await storage.import(newItems);

      expect((await storage.get("1"))?.name).toBe("Updated");
      expect((await storage.get("1"))?.value).toBe(999);
    });

    it("skips items without id", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const items = [
        { id: "1", name: "Valid", value: 100 },
        { id: "", name: "No ID", value: 200 },
        { name: "Missing ID", value: 300 } as TestItem,
      ];

      const imported = await storage.import(items);

      expect(imported).toBe(1);
      expect(await storage.size()).toBe(1);
    });

    it("returns count of imported items", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });
      const items: TestItem[] = [
        { id: "1", name: "First", value: 100 },
        { id: "2", name: "Second", value: 200 },
        { id: "3", name: "Third", value: 300 },
      ];

      const imported = await storage.import(items);

      expect(imported).toBe(3);
    });
  });

  describe("error handling", () => {
    it("handles invalid JSON gracefully", async () => {
      mockReadFile.mockResolvedValue("not valid json");

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      // Should not throw, should return empty
      expect(await storage.getAll()).toEqual([]);
    });

    it("handles read errors gracefully", async () => {
      mockReadFile.mockRejectedValue(new Error("Read error"));

      const storage = new JsonStorage<TestItem>({ filename: "test.json" });

      // Should not throw, should return empty
      expect(await storage.getAll()).toEqual([]);
    });

    it("handles write errors gracefully", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });
      mockWriteFile.mockRejectedValue(new Error("Write error"));

      const storage = new JsonStorage<TestItem>({
        filename: "test.json",
        writeDebounce: 10,
      });

      // Should not throw
      await storage.set("1", { id: "1", name: "Test", value: 100 });
      await expect(storage.flush()).resolves.not.toThrow();
    });
  });

  describe("flush", () => {
    it("writes pending changes immediately", async () => {
      mockReadFile.mockRejectedValue({ code: "ENOENT" });

      const storage = new JsonStorage<TestItem>({
        filename: "test.json",
        writeDebounce: 1000, // Long debounce
      });

      await storage.set("1", { id: "1", name: "Test", value: 100 });

      // Should not have written yet due to debounce
      expect(mockWriteFile).not.toHaveBeenCalled();

      // Force flush
      await storage.flush();

      expect(mockWriteFile).toHaveBeenCalled();
    });
  });
});
