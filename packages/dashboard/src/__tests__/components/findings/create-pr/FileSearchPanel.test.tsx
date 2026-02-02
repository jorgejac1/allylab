// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FileSearchPanel } from "../../../../components/findings/create-pr/FileSearchPanel";
import type { CodeSearchResult, RepoFile } from "../../../../components/findings/create-pr/useCreatePRForm";

// Mock UI components
vi.mock("../../../../components/ui", () => ({
  Button: ({ children, onClick, variant, disabled }: { children: React.ReactNode; onClick?: () => void; variant?: string; disabled?: boolean }) => (
    <button onClick={onClick} data-variant={variant} disabled={disabled}>{children}</button>
  ),
}));

// Helper to create mock search results
function makeSearchResult(path: string, matchedLines: Array<{ content: string }> = []): CodeSearchResult {
  return {
    path,
    matchedLines: matchedLines.map((l, i) => ({ lineNumber: i + 1, content: l.content })),
    repository: "owner/test-repo",
    url: `https://api.github.com/repos/owner/test-repo/contents/${path}`,
    htmlUrl: `https://github.com/owner/test-repo/blob/main/${path}`,
  };
}

// Helper to create mock repo files
function makeRepoFile(path: string): RepoFile {
  return { path, type: "file" };
}

describe("create-pr/FileSearchPanel", () => {
  const defaultProps = {
    repoName: "test-repo",
    searchMode: "options" as const,
    searchResults: [] as CodeSearchResult[],
    repoFiles: [] as RepoFile[],
    isSearching: false,
    searchError: null,
    customSearch: "",
    fileFilter: "",
    textContent: null,
    classNames: [],
    onSearch: vi.fn(),
    onBrowse: vi.fn(),
    onSelectFile: vi.fn(),
    onClose: vi.fn(),
    onBackToOptions: vi.fn(),
    onCustomSearchChange: vi.fn(),
    onFileFilterChange: vi.fn(),
  };

  // Header tests
  it("renders header with repo name", () => {
    render(<FileSearchPanel {...defaultProps} />);
    expect(screen.getByText(/Find file in test-repo/)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<FileSearchPanel {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: "" }); // X icon button has no text
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  // Options mode tests
  it("shows search options in options mode", () => {
    render(<FileSearchPanel {...defaultProps} searchMode="options" />);
    expect(screen.getByText("Choose how to find the file:")).toBeInTheDocument();
  });

  it("shows text content search option when textContent is provided", () => {
    render(<FileSearchPanel {...defaultProps} textContent="Click Here" />);
    expect(screen.getByText("Search by text content")).toBeInTheDocument();
    expect(screen.getByText(/"Click Here"/)).toBeInTheDocument();
  });

  it("truncates long text content", () => {
    const longText = "This is a very long text content that should be truncated after 40 characters";
    render(<FileSearchPanel {...defaultProps} textContent={longText} />);
    expect(screen.getByText(/"This is a very long text content that sh\.\.\."/)).toBeInTheDocument();
  });

  it("shows class name search option when classNames are provided", () => {
    render(<FileSearchPanel {...defaultProps} classNames={["btn-primary", "active"]} />);
    expect(screen.getByText("Search by class name")).toBeInTheDocument();
    expect(screen.getByText(".btn-primary, .active")).toBeInTheDocument();
  });

  it("calls onSearch with text content when text option is clicked", () => {
    const onSearch = vi.fn();
    render(<FileSearchPanel {...defaultProps} textContent="Search Me" onSearch={onSearch} />);

    fireEvent.click(screen.getByText("Search by text content"));
    expect(onSearch).toHaveBeenCalledWith('"Search Me"');
  });

  it("calls onSearch with first class name when class option is clicked", () => {
    const onSearch = vi.fn();
    render(<FileSearchPanel {...defaultProps} classNames={["btn", "primary"]} onSearch={onSearch} />);

    fireEvent.click(screen.getByText("Search by class name"));
    expect(onSearch).toHaveBeenCalledWith("btn");
  });

  it("shows custom search input", () => {
    render(<FileSearchPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText("Enter search term...")).toBeInTheDocument();
  });

  it("calls onCustomSearchChange when custom search input changes", () => {
    const onCustomSearchChange = vi.fn();
    render(<FileSearchPanel {...defaultProps} onCustomSearchChange={onCustomSearchChange} />);

    const input = screen.getByPlaceholderText("Enter search term...");
    fireEvent.change(input, { target: { value: "MyComponent" } });
    expect(onCustomSearchChange).toHaveBeenCalledWith("MyComponent");
  });

  it("calls onSearch on Enter key in custom search input", () => {
    const onSearch = vi.fn();
    render(<FileSearchPanel {...defaultProps} customSearch="MyQuery" onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Enter search term...");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSearch).toHaveBeenCalledWith("MyQuery");
  });

  it("does not call onSearch on Enter if custom search is empty", () => {
    const onSearch = vi.fn();
    render(<FileSearchPanel {...defaultProps} customSearch="" onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Enter search term...");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("disables Search button when custom search is empty", () => {
    render(<FileSearchPanel {...defaultProps} customSearch="" />);
    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
  });

  it("enables Search button when custom search has value", () => {
    render(<FileSearchPanel {...defaultProps} customSearch="query" />);
    expect(screen.getByRole("button", { name: "Search" })).not.toBeDisabled();
  });

  it("shows browse all files option", () => {
    render(<FileSearchPanel {...defaultProps} />);
    expect(screen.getByText("Browse all files")).toBeInTheDocument();
    expect(screen.getByText("View component files in the repository")).toBeInTheDocument();
  });

  it("calls onBrowse when browse option is clicked", () => {
    const onBrowse = vi.fn();
    render(<FileSearchPanel {...defaultProps} onBrowse={onBrowse} />);

    fireEvent.click(screen.getByText("Browse all files"));
    expect(onBrowse).toHaveBeenCalled();
  });

  // Results mode tests
  it("shows search results in results mode", () => {
    const results = [
      makeSearchResult("src/Button.tsx", [{ content: "Click here" }]),
      makeSearchResult("src/Header.tsx", [{ content: "Navigation" }]),
    ];
    render(<FileSearchPanel {...defaultProps} searchMode="results" searchResults={results} />);

    expect(screen.getByText("2 files found")).toBeInTheDocument();
    expect(screen.getByText("src/Button.tsx")).toBeInTheDocument();
    expect(screen.getByText("src/Header.tsx")).toBeInTheDocument();
  });

  it("shows file preview in results", () => {
    const results = [
      makeSearchResult("src/Button.tsx", [{ content: "const Button = () => {" }]),
    ];
    render(<FileSearchPanel {...defaultProps} searchMode="results" searchResults={results} />);

    expect(screen.getByText("const Button = () => {")).toBeInTheDocument();
  });

  it("shows searching state in results mode", () => {
    render(<FileSearchPanel {...defaultProps} searchMode="results" isSearching={true} />);

    expect(screen.getByText("Searching...")).toBeInTheDocument();
    expect(screen.getByText("Searching repository...")).toBeInTheDocument();
  });

  it("shows error in results mode", () => {
    render(<FileSearchPanel {...defaultProps} searchMode="results" searchError="Search failed" />);

    expect(screen.getByText("Search failed")).toBeInTheDocument();
  });

  it("calls onSelectFile when result is clicked", () => {
    const onSelectFile = vi.fn();
    const results = [makeSearchResult("src/Button.tsx")];
    render(<FileSearchPanel {...defaultProps} searchMode="results" searchResults={results} onSelectFile={onSelectFile} />);

    fireEvent.click(screen.getByText("src/Button.tsx"));
    expect(onSelectFile).toHaveBeenCalledWith("src/Button.tsx");
  });

  it("shows back button in results mode", () => {
    render(<FileSearchPanel {...defaultProps} searchMode="results" />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("calls onBackToOptions when back is clicked in results mode", () => {
    const onBackToOptions = vi.fn();
    render(<FileSearchPanel {...defaultProps} searchMode="results" onBackToOptions={onBackToOptions} />);

    fireEvent.click(screen.getByText("← Back"));
    expect(onBackToOptions).toHaveBeenCalled();
  });

  // Browse mode tests
  it("shows file list in browse mode", () => {
    const files = [
      makeRepoFile("src/App.tsx"),
      makeRepoFile("src/Button.tsx"),
    ];
    render(<FileSearchPanel {...defaultProps} searchMode="browse" repoFiles={files} />);

    expect(screen.getByText("2 component files")).toBeInTheDocument();
    expect(screen.getByText("src/App.tsx")).toBeInTheDocument();
    expect(screen.getByText("src/Button.tsx")).toBeInTheDocument();
  });

  it("shows loading state in browse mode", () => {
    render(<FileSearchPanel {...defaultProps} searchMode="browse" isSearching={true} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("Loading files...")).toBeInTheDocument();
  });

  it("shows error in browse mode", () => {
    render(<FileSearchPanel {...defaultProps} searchMode="browse" searchError="Failed to load files" />);

    expect(screen.getByText("Failed to load files")).toBeInTheDocument();
  });

  it("shows filter input in browse mode when files exist", () => {
    const files = [makeRepoFile("src/App.tsx")];
    render(<FileSearchPanel {...defaultProps} searchMode="browse" repoFiles={files} />);

    expect(screen.getByPlaceholderText(/Filter files/)).toBeInTheDocument();
  });

  it("does not show filter input when loading", () => {
    const files = [makeRepoFile("src/App.tsx")];
    render(<FileSearchPanel {...defaultProps} searchMode="browse" repoFiles={files} isSearching={true} />);

    expect(screen.queryByPlaceholderText(/Filter files/)).not.toBeInTheDocument();
  });

  it("calls onFileFilterChange when filter input changes", () => {
    const onFileFilterChange = vi.fn();
    const files = [makeRepoFile("src/App.tsx")];
    render(<FileSearchPanel {...defaultProps} searchMode="browse" repoFiles={files} onFileFilterChange={onFileFilterChange} />);

    const input = screen.getByPlaceholderText(/Filter files/);
    fireEvent.change(input, { target: { value: "Button" } });
    expect(onFileFilterChange).toHaveBeenCalledWith("Button");
  });

  it("filters files based on filter value", () => {
    const files = [
      makeRepoFile("src/App.tsx"),
      makeRepoFile("src/Button.tsx"),
      makeRepoFile("src/Header.tsx"),
    ];
    render(<FileSearchPanel {...defaultProps} searchMode="browse" repoFiles={files} fileFilter="Button" />);

    expect(screen.getByText("src/Button.tsx")).toBeInTheDocument();
    expect(screen.queryByText("src/App.tsx")).not.toBeInTheDocument();
    expect(screen.queryByText("src/Header.tsx")).not.toBeInTheDocument();
  });

  it("calls onSelectFile when file is clicked in browse mode", () => {
    const onSelectFile = vi.fn();
    const files = [makeRepoFile("src/Button.tsx")];
    render(<FileSearchPanel {...defaultProps} searchMode="browse" repoFiles={files} onSelectFile={onSelectFile} />);

    fireEvent.click(screen.getByText("src/Button.tsx"));
    expect(onSelectFile).toHaveBeenCalledWith("src/Button.tsx");
  });

  it("calls onBackToOptions when back is clicked in browse mode", () => {
    const onBackToOptions = vi.fn();
    render(<FileSearchPanel {...defaultProps} searchMode="browse" onBackToOptions={onBackToOptions} />);

    fireEvent.click(screen.getByText("← Back"));
    expect(onBackToOptions).toHaveBeenCalled();
  });

  // Hover effects
  it("changes background on hover for search option buttons", () => {
    render(<FileSearchPanel {...defaultProps} textContent="Test" />);

    const button = screen.getByText("Search by text content").closest("button")!;
    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({ background: "#f0f9ff" });

    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle({ background: "#fff" });
  });

  it("changes background on hover for file result items", () => {
    const results = [makeSearchResult("src/Button.tsx")];
    render(<FileSearchPanel {...defaultProps} searchMode="results" searchResults={results} />);

    const button = screen.getByText("src/Button.tsx").closest("button")!;
    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({ background: "#f0f9ff" });

    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle({ background: "#fff" });
  });

  it("changes background on hover for browse file items", () => {
    const files = [makeRepoFile("src/Button.tsx")];
    render(<FileSearchPanel {...defaultProps} searchMode="browse" repoFiles={files} />);

    const button = screen.getByText("src/Button.tsx").closest("button")!;
    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({ background: "#f0f9ff" });

    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle({ background: "#fff" });
  });
});
