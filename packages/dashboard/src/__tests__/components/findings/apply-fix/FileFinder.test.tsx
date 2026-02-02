// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FileFinder } from "../../../../components/findings/apply-fix/FileFinder";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock the utils module
vi.mock("../../../../components/findings/apply-fix/utils", () => ({
  calculateMatchConfidence: vi.fn(() => ({
    score: 80,
    level: "high" as const,
    matchedClasses: ["btn"],
    matchedText: "Click",
    details: "High confidence match",
  })),
  extractAllClasses: vi.fn(() => ["btn-primary", "btn-lg", "active"]),
}));

describe("findings/apply-fix/FileFinder", () => {
  const defaultProps = {
    repoOwner: "owner",
    repoName: "repo",
    branch: "main",
    textContent: "Click here",
    classNames: ["btn", "primary"],
    originalHtml: '<button class="btn">Click here</button>',
    scanUrl: "https://example.com/page",
    searchCode: vi.fn(),
    getRepoTree: vi.fn(),
    getFileContent: vi.fn(),
    onSelect: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders search options by default", () => {
    render(<FileFinder {...defaultProps} />);

    expect(screen.getByText("Search by text")).toBeInTheDocument();
    expect(screen.getByText("Browse all files")).toBeInTheDocument();
  });

  it("shows text content option when textContent is provided", () => {
    render(<FileFinder {...defaultProps} />);

    expect(screen.getByText(/Click here/)).toBeInTheDocument();
  });

  it("shows class search option when classes exist", () => {
    render(<FileFinder {...defaultProps} />);

    expect(screen.getByText("Search by class")).toBeInTheDocument();
  });

  it("shows skip button", () => {
    render(<FileFinder {...defaultProps} />);

    expect(screen.getByText("Skip - I'll find it myself")).toBeInTheDocument();
  });

  it("calls onSkip when skip button is clicked", () => {
    const onSkip = vi.fn();
    render(<FileFinder {...defaultProps} onSkip={onSkip} />);

    fireEvent.click(screen.getByText("Skip - I'll find it myself"));
    expect(onSkip).toHaveBeenCalled();
  });

  it("calls onSkip on Escape key in options mode", () => {
    const onSkip = vi.fn();
    render(<FileFinder {...defaultProps} onSkip={onSkip} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onSkip).toHaveBeenCalled();
  });

  it("shows custom search input", () => {
    render(<FileFinder {...defaultProps} />);

    expect(screen.getByPlaceholderText("Custom search...")).toBeInTheDocument();
  });

  it("enables search button when custom query is entered", () => {
    render(<FileFinder {...defaultProps} />);

    const input = screen.getByPlaceholderText("Custom search...");
    fireEvent.change(input, { target: { value: "MyComponent" } });

    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchButton).not.toBeDisabled();
  });

  it("performs text search when clicking Search by text", async () => {
    const searchCode = vi.fn().mockResolvedValue([
      { path: "src/Button.tsx", matchedLines: [{ content: "Click here" }] },
    ]);
    render(<FileFinder {...defaultProps} searchCode={searchCode} />);

    fireEvent.click(screen.getByText("Search by text"));

    await waitFor(() => {
      expect(searchCode).toHaveBeenCalledWith("owner", "repo", '"Click here"');
    });
  });

  it("performs class search when clicking Search by class", async () => {
    const searchCode = vi.fn().mockResolvedValue([
      { path: "src/Button.tsx", matchedLines: [{ content: "btn-primary" }] },
    ]);
    render(<FileFinder {...defaultProps} searchCode={searchCode} />);

    fireEvent.click(screen.getByText("Search by class"));

    await waitFor(() => {
      expect(searchCode).toHaveBeenCalledWith("owner", "repo", "btn-primary");
    });
  });

  it("shows search results after searching", async () => {
    const searchCode = vi.fn().mockResolvedValue([
      { path: "src/components/Button.tsx", matchedLines: [{ content: "Click here" }] },
    ]);
    render(<FileFinder {...defaultProps} searchCode={searchCode} />);

    fireEvent.click(screen.getByText("Search by text"));

    await waitFor(() => {
      expect(screen.getByText("src/components/Button.tsx")).toBeInTheDocument();
    });
  });

  it("shows error when search fails", async () => {
    const searchCode = vi.fn().mockRejectedValue(new Error("Search failed"));
    render(<FileFinder {...defaultProps} searchCode={searchCode} />);

    fireEvent.click(screen.getByText("Search by text"));

    await waitFor(() => {
      expect(screen.getByText(/Search failed/)).toBeInTheDocument();
    });
  });

  it("shows error when no files found", async () => {
    const searchCode = vi.fn().mockResolvedValue([]);
    render(<FileFinder {...defaultProps} searchCode={searchCode} />);

    fireEvent.click(screen.getByText("Search by text"));

    await waitFor(() => {
      expect(screen.getByText(/No files found/)).toBeInTheDocument();
    });
  });

  it("calls onSelect when a file result is clicked", async () => {
    const searchCode = vi.fn().mockResolvedValue([
      { path: "src/Button.tsx", matchedLines: [{ content: "Click" }] },
    ]);
    const onSelect = vi.fn();
    render(<FileFinder {...defaultProps} searchCode={searchCode} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Search by text"));

    await waitFor(() => {
      expect(screen.getByText("src/Button.tsx")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("src/Button.tsx"));
    expect(onSelect).toHaveBeenCalledWith("src/Button.tsx");
  });

  it("browses files when clicking Browse all files", async () => {
    const getRepoTree = vi.fn().mockResolvedValue([
      { path: "src/App.tsx" },
      { path: "src/Button.tsx" },
    ]);
    render(<FileFinder {...defaultProps} getRepoTree={getRepoTree} />);

    fireEvent.click(screen.getByText("Browse all files"));

    await waitFor(() => {
      expect(getRepoTree).toHaveBeenCalledWith("owner", "repo", "main");
    });

    await waitFor(() => {
      expect(screen.getByText("src/App.tsx")).toBeInTheDocument();
      expect(screen.getByText("src/Button.tsx")).toBeInTheDocument();
    });
  });

  it("shows filter input in browse mode", async () => {
    const getRepoTree = vi.fn().mockResolvedValue([{ path: "src/App.tsx" }]);
    render(<FileFinder {...defaultProps} getRepoTree={getRepoTree} />);

    fireEvent.click(screen.getByText("Browse all files"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Filter files...")).toBeInTheDocument();
    });
  });

  it("filters files in browse mode", async () => {
    const getRepoTree = vi.fn().mockResolvedValue([
      { path: "src/App.tsx" },
      { path: "src/Button.tsx" },
    ]);
    render(<FileFinder {...defaultProps} getRepoTree={getRepoTree} />);

    fireEvent.click(screen.getByText("Browse all files"));

    await waitFor(() => {
      expect(screen.getByText("src/App.tsx")).toBeInTheDocument();
    });

    const filterInput = screen.getByPlaceholderText("Filter files...");
    fireEvent.change(filterInput, { target: { value: "Button" } });

    expect(screen.queryByText("src/App.tsx")).not.toBeInTheDocument();
    expect(screen.getByText("src/Button.tsx")).toBeInTheDocument();
  });

  it("shows back button in search results and returns to options", async () => {
    const searchCode = vi.fn().mockResolvedValue([
      { path: "src/Button.tsx", matchedLines: [{ content: "Click" }] },
    ]);
    render(<FileFinder {...defaultProps} searchCode={searchCode} />);

    fireEvent.click(screen.getByText("Search by text"));

    await waitFor(() => {
      expect(screen.getByText("← Back")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("← Back"));

    // Should return to options mode
    expect(screen.getByText("Search by text")).toBeInTheDocument();
  });

  it("goes back to options on Escape in search mode", async () => {
    const searchCode = vi.fn().mockResolvedValue([
      { path: "src/Button.tsx", matchedLines: [{ content: "Click" }] },
    ]);
    render(<FileFinder {...defaultProps} searchCode={searchCode} />);

    fireEvent.click(screen.getByText("Search by text"));

    await waitFor(() => {
      expect(screen.getByText("1 files")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    // Should return to options mode
    await waitFor(() => {
      expect(screen.getByText("Search by text")).toBeInTheDocument();
    });
  });

  it("shows 'Recommended' badge for text search when textContent exists", () => {
    render(<FileFinder {...defaultProps} />);

    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });

  it("loads last search type from localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ "example.com": "class" }));
    render(<FileFinder {...defaultProps} />);

    // Should show 'Last worked' badge for class search
    expect(screen.getByText("Last worked")).toBeInTheDocument();
  });

  it("shows error when browse fails", async () => {
    const getRepoTree = vi.fn().mockRejectedValue(new Error("Browse failed"));
    render(<FileFinder {...defaultProps} getRepoTree={getRepoTree} />);

    fireEvent.click(screen.getByText("Browse all files"));

    await waitFor(() => {
      expect(screen.getByText("Failed to load files.")).toBeInTheDocument();
    });
  });

  it("shows empty message when browse returns no files", async () => {
    const getRepoTree = vi.fn().mockResolvedValue([]);
    render(<FileFinder {...defaultProps} getRepoTree={getRepoTree} />);

    fireEvent.click(screen.getByText("Browse all files"));

    await waitFor(() => {
      expect(screen.getByText("No component files found.")).toBeInTheDocument();
    });
  });

  it("performs custom search on Enter key", async () => {
    const searchCode = vi.fn().mockResolvedValue([
      { path: "src/Custom.tsx", matchedLines: [{ content: "custom" }] },
    ]);
    render(<FileFinder {...defaultProps} searchCode={searchCode} />);

    const input = screen.getByPlaceholderText("Custom search...");
    fireEvent.change(input, { target: { value: "MySearch" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(searchCode).toHaveBeenCalledWith("owner", "repo", "MySearch");
    });
  });

  it("shows selector class option when different from html classes", () => {
    render(
      <FileFinder
        {...defaultProps}
        classNames={["other-class"]}
      />
    );

    expect(screen.getByText("Search by selector class")).toBeInTheDocument();
    expect(screen.getByText(/\.other-class/)).toBeInTheDocument();
  });

  it("does not show selector class option when same as html classes", () => {
    render(
      <FileFinder
        {...defaultProps}
        classNames={["btn-primary"]}
      />
    );

    expect(screen.queryByText("Search by selector class")).not.toBeInTheDocument();
  });
});
