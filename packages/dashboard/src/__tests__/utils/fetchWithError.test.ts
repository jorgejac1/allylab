import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithError, getErrorMessage } from "../../utils/fetchWithError";

describe("utils/fetchWithError", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("fetchWithError", () => {
    it("returns JSON data for successful response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ id: 1, name: "Test" }),
      });

      const result = await fetchWithError<{ id: number; name: string }>("/api/test");

      expect(result).toEqual({ id: 1, name: "Test" });
      expect(mockFetch).toHaveBeenCalledWith("/api/test", undefined);
    });

    it("passes request options to fetch", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ success: true }),
      });

      const options: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "test" }),
      };

      await fetchWithError("/api/test", options);

      expect(mockFetch).toHaveBeenCalledWith("/api/test", options);
    });

    it("returns empty object for non-JSON successful response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/plain" }),
      });

      const result = await fetchWithError("/api/test");

      expect(result).toEqual({});
    });

    it("throws error with message from response.error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ error: "Invalid input" }),
      });

      await expect(fetchWithError("/api/test")).rejects.toThrow("Invalid input");
    });

    it("throws error with message from response.message", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ message: "Custom error message" }),
      });

      await expect(fetchWithError("/api/test")).rejects.toThrow("Custom error message");
    });

    it("throws default HTTP error when response has no error field", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ data: "something" }),
      });

      await expect(fetchWithError("/api/test")).rejects.toThrow("HTTP 404: Not Found");
    });

    it("throws default HTTP error when response body is not JSON", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("Not JSON")),
      });

      await expect(fetchWithError("/api/test")).rejects.toThrow("HTTP 500: Internal Server Error");
    });

    it("handles null content-type header", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers(),
      });

      const result = await fetchWithError("/api/test");

      expect(result).toEqual({});
    });
  });

  describe("getErrorMessage", () => {
    it("returns message from Error instance", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("returns string directly", () => {
      expect(getErrorMessage("Direct string error")).toBe("Direct string error");
    });

    it("returns default message for unknown types", () => {
      expect(getErrorMessage(123)).toBe("An unknown error occurred");
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
      expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
      expect(getErrorMessage({ custom: "object" })).toBe("An unknown error occurred");
    });
  });
});
