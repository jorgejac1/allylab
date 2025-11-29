import { describe, it, expect } from "vitest";
import { getWcagTags, getWcagLevel, getWcagVersion } from "../../utils/wcag";

describe("utils/wcag", () => {
  describe("getWcagTags", () => {
    it("returns correct tags for wcag2a", () => {
      const tags = getWcagTags("wcag2a");
      expect(tags).toContain("wcag2a");
      expect(tags).toContain("wcag21a");
      expect(tags).toContain("best-practice");
      expect(tags).not.toContain("wcag2aa");
    });

    it("returns correct tags for wcag2aa", () => {
      const tags = getWcagTags("wcag2aa");
      expect(tags).toContain("wcag2a");
      expect(tags).toContain("wcag2aa");
      expect(tags).toContain("wcag21a");
      expect(tags).toContain("wcag21aa");
      expect(tags).toContain("best-practice");
    });

    it("returns correct tags for wcag2aaa", () => {
      const tags = getWcagTags("wcag2aaa");
      expect(tags).toContain("wcag2a");
      expect(tags).toContain("wcag2aa");
      expect(tags).toContain("wcag2aaa");
      expect(tags).toContain("wcag21aaa");
      expect(tags).toContain("best-practice");
    });

    it("returns correct tags for wcag21a", () => {
      const tags = getWcagTags("wcag21a");
      expect(tags).toContain("wcag2a");
      expect(tags).toContain("wcag21a");
      expect(tags).toContain("best-practice");
      expect(tags).not.toContain("wcag21aa");
    });

    it("returns correct tags for wcag21aa", () => {
      const tags = getWcagTags("wcag21aa");
      expect(tags).toContain("wcag2a");
      expect(tags).toContain("wcag2aa");
      expect(tags).toContain("wcag21a");
      expect(tags).toContain("wcag21aa");
      expect(tags).toContain("best-practice");
    });

    it("returns correct tags for wcag22aa", () => {
      const tags = getWcagTags("wcag22aa");
      expect(tags).toContain("wcag2a");
      expect(tags).toContain("wcag2aa");
      expect(tags).toContain("wcag21a");
      expect(tags).toContain("wcag21aa");
      expect(tags).toContain("wcag22aa");
      expect(tags).toContain("best-practice");
    });

    it("defaults to wcag21aa for unknown standard", () => {
      const tags = getWcagTags("unknown-standard");
      const defaultTags = getWcagTags("wcag21aa");
      expect(tags).toEqual(defaultTags);
    });

    it("defaults to wcag21aa for empty string", () => {
      const tags = getWcagTags("");
      const defaultTags = getWcagTags("wcag21aa");
      expect(tags).toEqual(defaultTags);
    });

    it("always includes best-practice", () => {
      const standards = [
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22aa",
      ];
      standards.forEach((standard) => {
        const tags = getWcagTags(standard);
        expect(tags).toContain("best-practice");
      });
    });

    it("higher standards include lower level tags", () => {
      const wcag21aa = getWcagTags("wcag21aa");
      const wcag21a = getWcagTags("wcag21a");

      wcag21a.forEach((tag) => {
        expect(wcag21aa).toContain(tag);
      });
    });
  });

  describe("getWcagLevel", () => {
    it("returns AAA when tags contain wcag aaa pattern", () => {
      expect(getWcagLevel(["wcag2aaa"])).toBe("AAA");
      expect(getWcagLevel(["wcag21aaa"])).toBe("AAA");
      expect(getWcagLevel(["wcag2a", "wcag2aaa"])).toBe("AAA");
    });

    it("returns AA when tags contain wcag aa pattern", () => {
      expect(getWcagLevel(["wcag2aa"])).toBe("AA");
      expect(getWcagLevel(["wcag21aa"])).toBe("AA");
      expect(getWcagLevel(["wcag22aa"])).toBe("AA");
      expect(getWcagLevel(["wcag2a", "wcag21aa"])).toBe("AA");
    });

    it("returns A when tags contain wcag a pattern", () => {
      expect(getWcagLevel(["wcag2a"])).toBe("A");
      expect(getWcagLevel(["wcag21a"])).toBe("A");
    });

    it("returns Best Practice for best-practice tag", () => {
      expect(getWcagLevel(["best-practice"])).toBe("Best Practice");
    });

    it("returns Best Practice when no tags contain a/aa/aaa", () => {
      expect(getWcagLevel([])).toBe("Best Practice");
      expect(getWcagLevel(["something-else"])).toBe("Best Practice");
    });

    it("prioritizes highest level found", () => {
      expect(getWcagLevel(["wcag2aa", "wcag2aaa"])).toBe("AAA");
      expect(getWcagLevel(["wcag2a", "wcag21aa"])).toBe("AA");
    });
  });

  describe("getWcagVersion", () => {
    it("returns 2.2 for wcag22 tags", () => {
      expect(getWcagVersion(["wcag22aa"])).toBe("2.2");
      expect(getWcagVersion(["wcag22a"])).toBe("2.2");
    });

    it("returns 2.1 for wcag21 tags", () => {
      expect(getWcagVersion(["wcag21aa"])).toBe("2.1");
      expect(getWcagVersion(["wcag21a"])).toBe("2.1");
      expect(getWcagVersion(["wcag21aaa"])).toBe("2.1");
    });

    it("returns 2.0 for wcag2 tags without 21 or 22", () => {
      expect(getWcagVersion(["wcag2a"])).toBe("2.0");
      expect(getWcagVersion(["wcag2aa"])).toBe("2.0");
      expect(getWcagVersion(["wcag2aaa"])).toBe("2.0");
    });

    it("returns N/A when no wcag version tags", () => {
      expect(getWcagVersion(["best-practice"])).toBe("N/A");
      expect(getWcagVersion([])).toBe("N/A");
      expect(getWcagVersion(["something-else"])).toBe("N/A");
    });

    it("prioritizes highest version found", () => {
      expect(getWcagVersion(["wcag2a", "wcag22aa"])).toBe("2.2");
      expect(getWcagVersion(["wcag2aa", "wcag21a"])).toBe("2.1");
    });

    it("handles mixed version and level tags", () => {
      expect(getWcagVersion(["wcag21a", "wcag21aa", "best-practice"])).toBe(
        "2.1"
      );
      expect(getWcagVersion(["wcag2a", "wcag2aa", "wcag2aaa"])).toBe("2.0");
    });
  });
});
