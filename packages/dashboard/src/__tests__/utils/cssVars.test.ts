import { describe, expect, it } from "vitest";
import { cssVar, cssVars } from "../../utils/cssVars";

describe("utils/cssVars", () => {
  describe("cssVar", () => {
    it("creates a CSS custom property with string value", () => {
      const result = cssVar("progress", "75%");
      expect(result).toEqual({ "--progress": "75%" });
    });

    it("creates a CSS custom property with numeric value", () => {
      const result = cssVar("size", 100);
      expect(result).toEqual({ "--size": 100 });
    });

    it("handles color values", () => {
      const result = cssVar("color", "#3b82f6");
      expect(result).toEqual({ "--color": "#3b82f6" });
    });

    it("handles pixel values as strings", () => {
      const result = cssVar("width", "200px");
      expect(result).toEqual({ "--width": "200px" });
    });
  });

  describe("cssVars", () => {
    it("creates multiple CSS custom properties", () => {
      const result = cssVars({ width: "50%", height: "100px" });
      expect(result).toEqual({
        "--width": "50%",
        "--height": "100px",
      });
    });

    it("handles mixed string and numeric values", () => {
      const result = cssVars({ progress: "75%", size: 120, color: "#dc2626" });
      expect(result).toEqual({
        "--progress": "75%",
        "--size": 120,
        "--color": "#dc2626",
      });
    });

    it("handles empty object", () => {
      const result = cssVars({});
      expect(result).toEqual({});
    });

    it("handles single property", () => {
      const result = cssVars({ radius: "8px" });
      expect(result).toEqual({ "--radius": "8px" });
    });
  });
});
