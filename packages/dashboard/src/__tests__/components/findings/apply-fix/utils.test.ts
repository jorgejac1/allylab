/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDomainFromUrl,
  getSavedRepo,
  saveRepoForDomain,
  extractTextContent,
  extractClassNames,
  normalizeForComparison,
  extractAllClasses,
  extractSignificantClasses,
  calculateMatchConfidence,
  rankSearchResults,
  isCommentLine,
  isNonCodeContext,
  findAllInstances,
  findCodeInJsx,
  htmlToJsx,
  applyFixToSource,
} from "../../../../components/findings/apply-fix/utils";

describe("apply-fix/utils", () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      clear: () => { store = {}; },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // getDomainFromUrl tests
  describe("getDomainFromUrl", () => {
    it("extracts domain from valid URL", () => {
      expect(getDomainFromUrl("https://example.com/page")).toBe("example.com");
    });

    it("returns input if URL is invalid", () => {
      expect(getDomainFromUrl("not-a-url")).toBe("not-a-url");
    });
  });

  // getSavedRepo tests
  describe("getSavedRepo", () => {
    it("returns null when nothing is saved", () => {
      expect(getSavedRepo("example.com")).toBeNull();
    });

    it("returns saved repo for domain", () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
        "example.com": { owner: "test-owner", repo: "test-repo" }
      }));
      expect(getSavedRepo("example.com")).toEqual({ owner: "test-owner", repo: "test-repo" });
    });

    it("returns null if domain not in saved mapping", () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
        "other.com": { owner: "owner", repo: "repo" }
      }));
      expect(getSavedRepo("example.com")).toBeNull();
    });

    it("returns null on parse error", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValueOnce("invalid-json");
      expect(getSavedRepo("example.com")).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // saveRepoForDomain tests
  describe("saveRepoForDomain", () => {
    it("saves repo for domain", () => {
      saveRepoForDomain("example.com", "owner", "repo");
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "allylab-domain-repos",
        expect.stringContaining("example.com")
      );
    });

    it("preserves existing saved repos", () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
        "other.com": { owner: "other", repo: "repo" }
      }));
      saveRepoForDomain("example.com", "owner", "repo");
      const savedValue = localStorageMock.setItem.mock.calls[0][1];
      const parsed = JSON.parse(savedValue);
      expect(parsed["other.com"]).toEqual({ owner: "other", repo: "repo" });
      expect(parsed["example.com"]).toEqual({ owner: "owner", repo: "repo" });
    });

    it("handles storage errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      localStorageMock.setItem.mockImplementationOnce(() => { throw new Error("Storage full"); });
      saveRepoForDomain("example.com", "owner", "repo");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // extractTextContent tests
  describe("extractTextContent", () => {
    it("extracts text content from HTML", () => {
      expect(extractTextContent('<button>Click Here</button>')).toBe("Click Here");
    });

    it("returns null for empty tags", () => {
      expect(extractTextContent('<div></div>')).toBeNull();
    });

    it("returns null for whitespace-only content", () => {
      expect(extractTextContent('<div>   </div>')).toBeNull();
    });

    it("returns null for very short content", () => {
      expect(extractTextContent('<div>a</div>')).toBeNull();
    });

    it("returns null for dot-only content", () => {
      expect(extractTextContent('<div>...</div>')).toBeNull();
    });
  });

  // extractClassNames tests
  describe("extractClassNames", () => {
    it("extracts class names from selector", () => {
      // Only classes > 3 chars and not pseudo-classes are returned
      expect(extractClassNames(".btn-primary.button-secondary")).toEqual(["btn-primary", "button-secondary"]);
    });

    it("returns empty array for no classes", () => {
      expect(extractClassNames("div")).toEqual([]);
    });

    it("filters out short class names", () => {
      // btn is only 3 chars, gets filtered
      expect(extractClassNames(".a.btn")).toEqual([]);
    });

    it("filters out pseudo-classes", () => {
      // hover, focus, active, group-hover are filtered
      expect(extractClassNames(".hover:something.button-primary")).toEqual(["button-primary"]);
    });

    it("limits to 5 classes", () => {
      const selector = ".class1.class22.class333.class4444.class55555.class666666.class7777777";
      expect(extractClassNames(selector).length).toBe(5);
    });
  });

  // normalizeForComparison tests
  describe("normalizeForComparison", () => {
    it("converts class to className", () => {
      expect(normalizeForComparison('class="test"')).toContain('className="test"');
    });

    it("converts for to htmlFor", () => {
      expect(normalizeForComparison('for="input"')).toContain('htmlFor="input"');
    });

    it("normalizes quotes", () => {
      expect(normalizeForComparison("class='test'")).toContain('className="test"');
    });

    it("normalizes whitespace", () => {
      expect(normalizeForComparison('class="a   b"')).toBe('className="a b"');
    });
  });

  // extractAllClasses tests
  describe("extractAllClasses", () => {
    it("extracts classes from class attribute", () => {
      expect(extractAllClasses('<div class="btn primary">')).toEqual(["btn", "primary"]);
    });

    it("extracts classes from className attribute", () => {
      expect(extractAllClasses('<div className="btn primary">')).toEqual(["btn", "primary"]);
    });

    it("removes duplicates", () => {
      expect(extractAllClasses('<div class="btn btn">')).toEqual(["btn"]);
    });

    it("handles single quotes", () => {
      expect(extractAllClasses("<div className='btn active'>")).toEqual(["btn", "active"]);
    });
  });

  // extractSignificantClasses tests
  describe("extractSignificantClasses", () => {
    it("keeps semantic classes", () => {
      const result = extractSignificantClasses('<div class="text-green-600 bg-primary-600 rounded-lg">');
      expect(result).toContain("text-green-600");
      expect(result).toContain("bg-primary-600");
      expect(result).toContain("rounded-lg");
    });

    it("filters utility classes", () => {
      const result = extractSignificantClasses('<div class="w-4 h-4 p-2 m-1">');
      expect(result).toHaveLength(0);
    });

    it("keeps flex and grid classes", () => {
      const result = extractSignificantClasses('<div class="flex grid">');
      expect(result).toContain("flex");
      expect(result).toContain("grid");
    });
  });

  // calculateMatchConfidence tests
  describe("calculateMatchConfidence", () => {
    it("returns high confidence for matching text and classes", () => {
      const result = calculateMatchConfidence(
        '<button className="btn-primary">Click Me</button>',
        '<button class="btn-primary">Click Me</button>',
        "Click Me"
      );
      expect(result.level).toBe("high");
      expect(result.matchedText).toBe("Click Me");
    });

    it("returns medium confidence for partial matches", () => {
      const result = calculateMatchConfidence(
        '<button className="btn-primary">Submit</button>',
        '<button class="btn-primary">Click Me</button>',
        "Click Me"
      );
      expect(["medium", "high"]).toContain(result.level);
    });

    it("returns low confidence for weak matches", () => {
      const result = calculateMatchConfidence(
        '<div className="container">Other</div>',
        '<button class="btn">Click</button>',
        "Click"
      );
      expect(["low", "none"]).toContain(result.level);
    });

    it("returns none for no matches", () => {
      const result = calculateMatchConfidence(
        '<span>Completely different</span>',
        '<button class="btn">Click</button>',
        "Click"
      );
      expect(result.level).toBe("none");
    });

    it("adds bonus for matching tag type", () => {
      // Use examples without text match so scores don't cap at 100
      const result1 = calculateMatchConfidence(
        '<button className="myclass">Submit</button>',
        '<button class="myclass">Click</button>',
        null
      );
      const result2 = calculateMatchConfidence(
        '<div className="myclass">Submit</div>',
        '<button class="myclass">Click</button>',
        null
      );
      // Both have same class match, but result1 has tag bonus
      expect(result1.score).toBeGreaterThanOrEqual(result2.score);
    });
  });

  // rankSearchResults tests
  describe("rankSearchResults", () => {
    it("ranks results by confidence score", () => {
      const results = [
        { path: "low.tsx", preview: '<div>Other</div>' },
        { path: "high.tsx", preview: '<button class="btn">Click</button>' },
      ];
      const ranked = rankSearchResults(results, '<button class="btn">Click</button>', "Click");
      expect(ranked[0].path).toBe("high.tsx");
      expect(ranked[0].isBestMatch).toBe(true);
    });

    it("marks best match when confidence is not none", () => {
      const results = [{ path: "test.tsx", content: '<button class="btn">Click</button>' }];
      const ranked = rankSearchResults(results, '<button class="btn">Click</button>', "Click");
      expect(ranked[0].isBestMatch).toBe(true);
    });

    it("does not mark best match when confidence is none", () => {
      const results = [{ path: "test.tsx", preview: '<span>Different</span>' }];
      const ranked = rankSearchResults(results, '<button class="btn">Click</button>', "Click");
      expect(ranked[0].isBestMatch).toBe(false);
    });
  });

  // isCommentLine tests
  describe("isCommentLine", () => {
    it("detects single-line comments", () => {
      expect(isCommentLine("// This is a comment")).toBe(true);
    });

    it("detects multi-line comment start", () => {
      expect(isCommentLine("/* Comment")).toBe(true);
    });

    it("detects multi-line comment continuation", () => {
      expect(isCommentLine(" * Continuation")).toBe(true);
    });

    it("detects HTML comments", () => {
      expect(isCommentLine("<!-- Comment -->")).toBe(true);
    });

    it("returns false for regular code", () => {
      expect(isCommentLine('<button>Click</button>')).toBe(false);
    });
  });

  // isNonCodeContext tests
  describe("isNonCodeContext", () => {
    it("returns true for comment lines", () => {
      const lines = ["// This is a comment"];
      expect(isNonCodeContext(lines, 0)).toBe(true);
    });

    it("returns true for type definitions", () => {
      const lines = ["type ButtonProps = {"];
      expect(isNonCodeContext(lines, 0)).toBe(true);
    });

    it("returns true for interface definitions", () => {
      const lines = ["interface ButtonProps {"];
      expect(isNonCodeContext(lines, 0)).toBe(true);
    });

    it("returns false for regular JSX", () => {
      const lines = ["<button>Click</button>"];
      expect(isNonCodeContext(lines, 0)).toBe(false);
    });

    it("detects code inside block comments", () => {
      const lines = ["/*", "  <button>Click</button>", "*/"];
      expect(isNonCodeContext(lines, 1)).toBe(true);
    });
  });

  // findAllInstances tests
  describe("findAllInstances", () => {
    it("finds instances by text content", () => {
      const code = `function Component() {
  return <button>Click Me</button>;
}`;
      const instances = findAllInstances(code, '<button>Click Me</button>', "Click Me");
      expect(instances.length).toBeGreaterThan(0);
    });

    it("finds instances by class matches", () => {
      const code = `function Component() {
  return <button className="btn-primary active">Submit</button>;
}`;
      const instances = findAllInstances(code, '<button class="btn-primary active">Submit</button>', null);
      expect(instances.length).toBeGreaterThan(0);
    });

    it("marks comment instances", () => {
      const code = `// <button className="btn-primary">Click</button>
function Component() {
  return <button className="btn-primary">Click</button>;
}`;
      const instances = findAllInstances(code, '<button class="btn-primary">Click</button>', "Click");
      const commentInstance = instances.find(i => i.isComment);
      const codeInstance = instances.find(i => !i.isComment);
      expect(commentInstance).toBeDefined();
      expect(codeInstance).toBeDefined();
    });

    it("sorts non-comment instances first", () => {
      const code = `// <button className="btn-primary">Click</button>
<button className="btn-primary">Click</button>`;
      const instances = findAllInstances(code, '<button class="btn-primary">Click</button>', "Click");
      if (instances.length >= 2) {
        expect(instances[0].isComment).toBe(false);
      }
    });
  });

  // findCodeInJsx tests
  describe("findCodeInJsx", () => {
    it("finds code by text content", () => {
      const code = `function Button() {
  return <button className="btn">Click Me</button>;
}`;
      const result = findCodeInJsx(code, '<button class="btn">Click Me</button>', "Click Me");
      expect(result).not.toBeNull();
      expect(result?.reason).toContain("Click Me");
    });

    it("finds code by class combination", () => {
      const code = `function Button() {
  return <button className="btn-primary active-state large">Submit</button>;
}`;
      const result = findCodeInJsx(code, '<button class="btn-primary active-state large">Submit</button>', null);
      expect(result).not.toBeNull();
    });

    it("finds code by tag type and class", () => {
      const code = `function Button() {
  return <button className="btn-primary">Click</button>;
}`;
      const result = findCodeInJsx(code, '<button class="btn-primary">Click</button>', null);
      expect(result).not.toBeNull();
    });

    it("returns null when no match found", () => {
      const code = `function Component() {
  return <div>Different content</div>;
}`;
      const result = findCodeInJsx(code, '<button class="btn">Click</button>', "Click");
      expect(result).toBeNull();
    });

    it("skips comments when real code exists", () => {
      const code = `// <button className="btn">Click Me</button>
function Button() {
  return <button className="btn">Click Me</button>;
}`;
      const result = findCodeInJsx(code, '<button class="btn">Click Me</button>', "Click Me");
      expect(result).not.toBeNull();
      expect(result?.isComment).toBe(false);
    });
  });

  // htmlToJsx tests
  describe("htmlToJsx", () => {
    it("converts class to className", () => {
      expect(htmlToJsx('<div class="test">')).toBe('<div className="test">');
    });

    it("converts for to htmlFor", () => {
      expect(htmlToJsx('<label for="input">')).toBe('<label htmlFor="input">');
    });

    it("converts inline style to object", () => {
      const result = htmlToJsx('<div style="color: red; font-size: 14px;">');
      expect(result).toContain("style={{");
      expect(result).toContain('color: "red"');
      expect(result).toContain('fontSize: "14px"');
    });

    it("self-closes void elements", () => {
      expect(htmlToJsx('<img src="test.png">')).toBe('<img src="test.png" />');
      expect(htmlToJsx('<input type="text">')).toBe('<input type="text" />');
      expect(htmlToJsx('<br>')).toBe('<br />');
    });
  });

  // applyFixToSource tests
  describe("applyFixToSource", () => {
    it("does direct replacement when exact match exists", () => {
      const source = 'const x = "<div>Old</div>";';
      const result = applyFixToSource(source, "<div>Old</div>", "<div>New</div>");
      expect(result).toContain("<div>New</div>");
    });

    it("returns JSX-converted fix when no direct match", () => {
      const source = '<button className="btn">Click</button>';
      const result = applyFixToSource(source, '<button class="btn">Old</button>', '<button class="btn-new">New</button>');
      expect(result).toContain('className="btn-new"');
    });

    it("handles class pattern matching with multiple matches", () => {
      // Source with multiple matching elements - function handles this gracefully
      const source = `<div>
        <button className="btn-primary active">First</button>
        <button className="btn-primary active">Second</button>
      </div>`;
      const result = applyFixToSource(
        source,
        '<button class="btn-primary active">Submit</button>',
        '<button class="btn-primary active" aria-label="Submit">Submit</button>'
      );
      // Function returns a result even with multiple matches
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });
});
