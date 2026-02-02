// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RepoSelector } from "../../../../components/findings/apply-fix/RepoSelector";
import type { GitHubRepo } from "../../../../types/github";

const mockRepo: GitHubRepo = {
  id: 1,
  name: "test-repo",
  full_name: "owner/test-repo",
  html_url: "https://github.com/owner/test-repo",
  owner: {
    login: "owner",
    avatar_url: "https://example.com/avatar.png",
  },
  default_branch: "main",
  private: false,
};

const mockRepo2: GitHubRepo = {
  id: 2,
  name: "another-repo",
  full_name: "owner/another-repo",
  html_url: "https://github.com/owner/another-repo",
  owner: {
    login: "owner",
    avatar_url: "https://example.com/avatar2.png",
  },
  default_branch: "main",
  private: false,
};

describe("findings/apply-fix/RepoSelector", () => {
  it("shows loading state when isLoading is true", () => {
    render(
      <RepoSelector
        repos={[]}
        selectedRepo={null}
        isLoading={true}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    expect(screen.getByText("Loading repositories...")).toBeInTheDocument();
  });

  it("shows repo list when showSelector is true", () => {
    render(
      <RepoSelector
        repos={[mockRepo, mockRepo2]}
        selectedRepo={null}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    expect(screen.getByText("owner/test-repo")).toBeInTheDocument();
    expect(screen.getByText("owner/another-repo")).toBeInTheDocument();
  });

  it("shows empty message when no repos available", () => {
    render(
      <RepoSelector
        repos={[]}
        selectedRepo={null}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    expect(screen.getByText("No repositories found.")).toBeInTheDocument();
  });

  it("calls onSelect when repo is clicked", () => {
    const onSelect = vi.fn();
    render(
      <RepoSelector
        repos={[mockRepo]}
        selectedRepo={null}
        isLoading={false}
        showSelector={true}
        onSelect={onSelect}
        onShowSelector={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("owner/test-repo"));
    expect(onSelect).toHaveBeenCalledWith(mockRepo);
  });

  it("shows selected repo display when repo is selected and showSelector is false", () => {
    render(
      <RepoSelector
        repos={[mockRepo]}
        selectedRepo={mockRepo}
        isLoading={false}
        showSelector={false}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    expect(screen.getByText("owner/test-repo")).toBeInTheDocument();
    expect(screen.getByText("Change")).toBeInTheDocument();
  });

  it("calls onShowSelector when Change button is clicked", () => {
    const onShowSelector = vi.fn();
    render(
      <RepoSelector
        repos={[mockRepo]}
        selectedRepo={mockRepo}
        isLoading={false}
        showSelector={false}
        onSelect={vi.fn()}
        onShowSelector={onShowSelector}
      />
    );

    fireEvent.click(screen.getByText("Change"));
    expect(onShowSelector).toHaveBeenCalled();
  });

  it("does not show Change button when showSelector is true", () => {
    render(
      <RepoSelector
        repos={[mockRepo]}
        selectedRepo={mockRepo}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    expect(screen.queryByText("Change")).not.toBeInTheDocument();
  });

  it("shows check icon for selected repo in list", () => {
    const { container } = render(
      <RepoSelector
        repos={[mockRepo, mockRepo2]}
        selectedRepo={mockRepo}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    // Check icon should be visible for selected repo
    const checkIcon = container.querySelector('svg.lucide-check');
    expect(checkIcon).toBeInTheDocument();
  });

  it("highlights selected repo in list", () => {
    render(
      <RepoSelector
        repos={[mockRepo, mockRepo2]}
        selectedRepo={mockRepo}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    // Find the button for the selected repo
    const selectedButton = screen.getByRole("button", { name: /owner\/test-repo/ });
    expect(selectedButton).toHaveStyle({ background: "#f0f9ff" });
  });

  it("changes background on hover for non-selected repos", () => {
    render(
      <RepoSelector
        repos={[mockRepo, mockRepo2]}
        selectedRepo={mockRepo}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    const nonSelectedButton = screen.getByRole("button", { name: /owner\/another-repo/ });

    fireEvent.mouseEnter(nonSelectedButton);
    expect(nonSelectedButton).toHaveStyle({ background: "#f8fafc" });

    fireEvent.mouseLeave(nonSelectedButton);
    expect(nonSelectedButton).toHaveStyle({ background: "#fff" });
  });

  it("maintains selected background on hover for selected repo", () => {
    render(
      <RepoSelector
        repos={[mockRepo]}
        selectedRepo={mockRepo}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    const selectedButton = screen.getByRole("button", { name: /owner\/test-repo/ });

    fireEvent.mouseEnter(selectedButton);
    // Selected repo should keep its selected background
    expect(selectedButton).toHaveStyle({ background: "#f0f9ff" });

    fireEvent.mouseLeave(selectedButton);
    expect(selectedButton).toHaveStyle({ background: "#f0f9ff" });
  });

  it("renders repository label with icon", () => {
    const { container } = render(
      <RepoSelector
        repos={[mockRepo]}
        selectedRepo={null}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    expect(screen.getByText("Repository")).toBeInTheDocument();
    // FolderGit2 icon should be present
    expect(container.querySelector('svg.lucide-folder-git-2')).toBeInTheDocument();
  });

  it("renders owner avatar images", () => {
    const { container } = render(
      <RepoSelector
        repos={[mockRepo]}
        selectedRepo={null}
        isLoading={false}
        showSelector={true}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    // Image has alt="" so it has presentation role, use container query
    const avatar = container.querySelector('img[src="https://example.com/avatar.png"]');
    expect(avatar).toBeInTheDocument();
  });

  it("shows repo list when no repo is selected and showSelector is false", () => {
    render(
      <RepoSelector
        repos={[mockRepo]}
        selectedRepo={null}
        isLoading={false}
        showSelector={false}
        onSelect={vi.fn()}
        onShowSelector={vi.fn()}
      />
    );

    // Should show repo list because no repo is selected
    expect(screen.getByText("owner/test-repo")).toBeInTheDocument();
    expect(screen.queryByText("Change")).not.toBeInTheDocument();
  });
});
