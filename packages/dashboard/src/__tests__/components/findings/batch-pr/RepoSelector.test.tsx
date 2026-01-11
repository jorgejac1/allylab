// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RepoSelector } from "../../../../components/findings/batch-pr/RepoSelector";
import type { GitHubRepo } from "../../../../types/github";

// Mock UI components
vi.mock("../../../../components/ui", () => ({
  Button: ({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant?: string }) => (
    <button onClick={onClick} data-variant={variant}>{children}</button>
  ),
}));

describe("batch-pr/RepoSelector", () => {
  const mockRepos: GitHubRepo[] = [
    {
      id: 1,
      name: "test-repo",
      full_name: "owner/test-repo",
      owner: { login: "owner", avatar_url: "https://avatar.url/1" },
      private: false,
      default_branch: "main",
      html_url: "https://github.com/owner/test-repo",
    },
    {
      id: 2,
      name: "private-repo",
      full_name: "owner/private-repo",
      owner: { login: "owner", avatar_url: "https://avatar.url/2" },
      private: true,
      default_branch: "develop",
      html_url: "https://github.com/owner/private-repo",
    },
  ];

  const defaultProps = {
    repos: mockRepos,
    isLoading: false,
    fixCount: 3,
    onSelect: vi.fn(),
    onBack: vi.fn(),
  };

  it("displays fix count in description", () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText(/Select the repository where you want to apply 3 fixes/)).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    render(<RepoSelector {...defaultProps} isLoading={true} />);
    expect(screen.getByText("Loading repositories...")).toBeInTheDocument();
  });

  it("does not show loading when isLoading is false", () => {
    render(<RepoSelector {...defaultProps} isLoading={false} />);
    expect(screen.queryByText("Loading repositories...")).not.toBeInTheDocument();
  });

  it("renders all repositories", () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText("owner/test-repo")).toBeInTheDocument();
    expect(screen.getByText("owner/private-repo")).toBeInTheDocument();
  });

  it("displays public repo indicator", () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText(/🌐 Public/)).toBeInTheDocument();
  });

  it("displays private repo indicator", () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText(/🔒 Private/)).toBeInTheDocument();
  });

  it("displays default branch for each repo", () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText(/main/)).toBeInTheDocument();
    expect(screen.getByText(/develop/)).toBeInTheDocument();
  });

  it("calls onSelect when a repo is clicked", () => {
    const onSelect = vi.fn();
    render(<RepoSelector {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("owner/test-repo"));
    expect(onSelect).toHaveBeenCalledWith(mockRepos[0]);
  });

  it("calls onSelect with correct repo when private repo is clicked", () => {
    const onSelect = vi.fn();
    render(<RepoSelector {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("owner/private-repo"));
    expect(onSelect).toHaveBeenCalledWith(mockRepos[1]);
  });

  it("renders Back button", () => {
    render(<RepoSelector {...defaultProps} />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("calls onBack when Back button is clicked", () => {
    const onBack = vi.fn();
    render(<RepoSelector {...defaultProps} onBack={onBack} />);

    fireEvent.click(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders repo owner avatar images", () => {
    const { container } = render(<RepoSelector {...defaultProps} />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "https://avatar.url/1");
    expect(images[1]).toHaveAttribute("src", "https://avatar.url/2");
  });

  it("renders avatar images with empty alt for decorative purposes", () => {
    const { container } = render(<RepoSelector {...defaultProps} />);
    const images = container.querySelectorAll("img");
    images.forEach(img => {
      expect(img).toHaveAttribute("alt", "");
    });
  });

  it("renders arrow indicator for each repo", () => {
    render(<RepoSelector {...defaultProps} />);
    const arrows = screen.getAllByText("→");
    expect(arrows).toHaveLength(2);
  });

  // Test hover states for RepoRow
  it("changes background on hover for repo row", () => {
    render(<RepoSelector {...defaultProps} />);
    const repoButton = screen.getByText("owner/test-repo").closest("button")!;

    // Initial state
    expect(repoButton).toHaveStyle({ background: "rgb(255, 255, 255)" });

    // Hover
    fireEvent.mouseEnter(repoButton);
    expect(repoButton).toHaveStyle({ background: "rgb(248, 250, 252)" });

    // Leave hover
    fireEvent.mouseLeave(repoButton);
    expect(repoButton).toHaveStyle({ background: "rgb(255, 255, 255)" });
  });

  it("renders with empty repos array", () => {
    render(<RepoSelector {...defaultProps} repos={[]} />);
    expect(screen.getByText(/Select the repository/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
