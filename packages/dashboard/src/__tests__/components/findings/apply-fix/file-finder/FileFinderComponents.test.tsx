/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  OptionButton,
  FileResultItem,
  SearchOptions,
} from "../../../../../components/findings/apply-fix/file-finder";
import { FileText } from "lucide-react";

// Mock UI components
vi.mock("../../../../../components/ui", () => ({
  Button: ({ children, onClick, variant, disabled }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

describe("file-finder/OptionButton", () => {
  const defaultProps = {
    icon: <FileText size={16} data-testid="icon" />,
    title: "Search by text",
    subtitle: "Search for text content",
    onClick: vi.fn(),
  };

  it("renders title", () => {
    render(<OptionButton {...defaultProps} />);
    expect(screen.getByText("Search by text")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<OptionButton {...defaultProps} />);
    expect(screen.getByText("Search for text content")).toBeInTheDocument();
  });

  it("renders icon", () => {
    render(<OptionButton {...defaultProps} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<OptionButton {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows Recommended badge when badge is recommended", () => {
    render(<OptionButton {...defaultProps} badge="recommended" />);
    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });

  it("shows Last worked badge when badge is last-worked", () => {
    render(<OptionButton {...defaultProps} badge="last-worked" />);
    expect(screen.getByText(/Last worked/)).toBeInTheDocument();
  });

  it("does not show badge when badge is null", () => {
    render(<OptionButton {...defaultProps} badge={null} />);
    expect(screen.queryByText("Recommended")).not.toBeInTheDocument();
    expect(screen.queryByText(/Last worked/)).not.toBeInTheDocument();
  });

  it("applies highlighted styling when recommended", () => {
    const { container } = render(<OptionButton {...defaultProps} badge="recommended" />);
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveStyle({ background: "#eff6ff" });
  });

  it("applies highlighted styling when last-worked", () => {
    const { container } = render(<OptionButton {...defaultProps} badge="last-worked" />);
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveStyle({ background: "#eff6ff" });
  });

  it("applies default styling when no badge", () => {
    const { container } = render(<OptionButton {...defaultProps} />);
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveStyle({ background: "#fff" });
  });
});

describe("file-finder/FileResultItem", () => {
  const defaultFile = {
    path: "src/components/Button.tsx",
    name: "Button.tsx",
    confidence: {
      level: "high" as const,
      score: 90,
      details: "Strong match",
      matchedClasses: ["btn", "primary"],
      matchedText: "Click me",
    },
    isBestMatch: false,
  };

  const defaultProps = {
    file: defaultFile,
    isRanking: false,
    onSelect: vi.fn(),
  };

  it("renders file path", () => {
    render(<FileResultItem {...defaultProps} />);
    expect(screen.getByText("src/components/Button.tsx")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(<FileResultItem {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows Best Match badge when isBestMatch is true", () => {
    const file = { ...defaultFile, isBestMatch: true };
    render(<FileResultItem {...defaultProps} file={file} />);
    expect(screen.getByText("Best Match")).toBeInTheDocument();
  });

  it("does not show Best Match badge when isBestMatch is false", () => {
    render(<FileResultItem {...defaultProps} />);
    expect(screen.queryByText("Best Match")).not.toBeInTheDocument();
  });

  it("shows confidence badge for high confidence", () => {
    render(<FileResultItem {...defaultProps} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("shows confidence badge for medium confidence", () => {
    const file = {
      ...defaultFile,
      confidence: { level: "medium" as const, score: 60, details: "Partial match", matchedClasses: [], matchedText: null },
    };
    render(<FileResultItem {...defaultProps} file={file} />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("shows confidence badge for low confidence", () => {
    const file = {
      ...defaultFile,
      confidence: { level: "low" as const, score: 30, details: "Weak match", matchedClasses: [], matchedText: null },
    };
    render(<FileResultItem {...defaultProps} file={file} />);
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("shows confidence details when not ranking", () => {
    render(<FileResultItem {...defaultProps} />);
    expect(screen.getByText("Strong match")).toBeInTheDocument();
  });

  it("hides confidence details when ranking", () => {
    render(<FileResultItem {...defaultProps} isRanking={true} />);
    expect(screen.queryByText("Strong match")).not.toBeInTheDocument();
  });

  it("renders preview when available", () => {
    const file = { ...defaultFile, preview: "const Button = () => {}" };
    render(<FileResultItem {...defaultProps} file={file} />);
    expect(screen.getByText("const Button = () => {}")).toBeInTheDocument();
  });

  it("truncates long preview", () => {
    const longPreview = "a".repeat(200);
    const file = { ...defaultFile, preview: longPreview };
    render(<FileResultItem {...defaultProps} file={file} />);
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  it("applies best match styling", () => {
    const file = { ...defaultFile, isBestMatch: true };
    const { container } = render(<FileResultItem {...defaultProps} file={file} />);
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveStyle({ background: "#f0fdf4" });
  });
});

describe("file-finder/SearchOptions", () => {
  const defaultProps = {
    textContent: "Click me",
    classNames: ["btn", "primary"],
    htmlClasses: ["button-class", "submit-button"],
    customQuery: "",
    lastSearchType: null,
    onCustomQueryChange: vi.fn(),
    onSearch: vi.fn(),
    onBrowse: vi.fn(),
    onSkip: vi.fn(),
  };

  it("renders Search by text option when textContent provided", () => {
    render(<SearchOptions {...defaultProps} />);
    expect(screen.getByText("Search by text")).toBeInTheDocument();
  });

  it("shows truncated text content in subtitle", () => {
    render(<SearchOptions {...defaultProps} />);
    expect(screen.getByText(/"Click me"/)).toBeInTheDocument();
  });

  it("renders Search by class option when significant classes exist", () => {
    render(<SearchOptions {...defaultProps} />);
    expect(screen.getByText("Search by class")).toBeInTheDocument();
  });

  it("renders Browse all files option", () => {
    render(<SearchOptions {...defaultProps} />);
    expect(screen.getByText("Browse all files")).toBeInTheDocument();
  });

  it("renders custom search input", () => {
    render(<SearchOptions {...defaultProps} />);
    expect(screen.getByPlaceholderText("Custom search...")).toBeInTheDocument();
  });

  it("renders Skip button", () => {
    render(<SearchOptions {...defaultProps} />);
    expect(screen.getByText("Skip - I'll find it myself")).toBeInTheDocument();
  });

  it("calls onSearch when text option clicked", () => {
    const onSearch = vi.fn();
    render(<SearchOptions {...defaultProps} onSearch={onSearch} />);

    fireEvent.click(screen.getByText("Search by text"));
    expect(onSearch).toHaveBeenCalledWith('"Click me"', "text");
  });

  it("calls onBrowse when Browse option clicked", () => {
    const onBrowse = vi.fn();
    render(<SearchOptions {...defaultProps} onBrowse={onBrowse} />);

    fireEvent.click(screen.getByText("Browse all files"));
    expect(onBrowse).toHaveBeenCalledTimes(1);
  });

  it("calls onSkip when Skip clicked", () => {
    const onSkip = vi.fn();
    render(<SearchOptions {...defaultProps} onSkip={onSkip} />);

    fireEvent.click(screen.getByText("Skip - I'll find it myself"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("updates custom query when typing", () => {
    const onCustomQueryChange = vi.fn();
    render(<SearchOptions {...defaultProps} onCustomQueryChange={onCustomQueryChange} />);

    fireEvent.change(screen.getByPlaceholderText("Custom search..."), {
      target: { value: "test query" },
    });
    expect(onCustomQueryChange).toHaveBeenCalledWith("test query");
  });

  it("calls onSearch on Enter with custom query", () => {
    const onSearch = vi.fn();
    render(<SearchOptions {...defaultProps} customQuery="my query" onSearch={onSearch} />);

    fireEvent.keyDown(screen.getByPlaceholderText("Custom search..."), {
      key: "Enter",
    });
    expect(onSearch).toHaveBeenCalledWith("my query", "custom");
  });

  it("disables Search button when custom query is empty", () => {
    render(<SearchOptions {...defaultProps} customQuery="" />);
    expect(screen.getByText("Search")).toBeDisabled();
  });

  it("enables Search button when custom query has value", () => {
    render(<SearchOptions {...defaultProps} customQuery="test" />);
    expect(screen.getByText("Search")).not.toBeDisabled();
  });

  it("shows recommended badge for text search when no last search", () => {
    render(<SearchOptions {...defaultProps} />);
    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });

  it("shows last-worked badge when matching last search type", () => {
    render(<SearchOptions {...defaultProps} lastSearchType="text" />);
    expect(screen.getByText(/Last worked/)).toBeInTheDocument();
  });

  it("does not render text option when no text content", () => {
    render(<SearchOptions {...defaultProps} textContent={null} />);
    expect(screen.queryByText("Search by text")).not.toBeInTheDocument();
  });

  it("renders keyboard hint for Esc", () => {
    render(<SearchOptions {...defaultProps} />);
    expect(screen.getByText("Esc")).toBeInTheDocument();
  });
});
