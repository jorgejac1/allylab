import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useApplyFixWorkflow } from "../../hooks/useApplyFixWorkflow";
import type { GitHubRepo } from "../../types/github";

const mockRepo: GitHubRepo = {
  id: 1,
  name: "test-repo",
  full_name: "owner/test-repo",
  owner: { login: "owner", avatar_url: "https://avatar.com" },
  default_branch: "main",
  private: false,
  html_url: "https://github.com/owner/test-repo",
};

const mockRepo2: GitHubRepo = {
  id: 2,
  name: "other-repo",
  full_name: "owner/other-repo",
  owner: { login: "owner", avatar_url: "https://avatar.com" },
  default_branch: "main",
  private: false,
  html_url: "https://github.com/owner/other-repo",
};

describe("hooks/useApplyFixWorkflow", () => {
  const createMocks = () => ({
    getRepos: vi.fn().mockResolvedValue([mockRepo, mockRepo2]),
    getSavedRepo: vi.fn().mockReturnValue(null),
    saveRepoForDomain: vi.fn(),
  });

  it("initializes with default state", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    expect(result.current.state.step).toBe("preview");
    expect(result.current.state.repos).toEqual([]);
    expect(result.current.state.selectedRepo).toBeNull();
    expect(result.current.state.filePath).toBeNull();
    expect(result.current.state.isCreatingPR).toBe(false);
  });

  it("loads repos when open and connected", async () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: true,
        isConnected: true,
        domain: "example.com",
        ...mocks,
      })
    );

    await waitFor(() => {
      expect(result.current.state.repos).toEqual([mockRepo, mockRepo2]);
    });
  });

  it("selects saved repo on load", async () => {
    const mocks = createMocks();
    mocks.getSavedRepo.mockReturnValue({ owner: "owner", repo: "test-repo" });

    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: true,
        isConnected: true,
        domain: "example.com",
        ...mocks,
      })
    );

    await waitFor(() => {
      expect(result.current.state.selectedRepo).toEqual(mockRepo);
    });
  });

  it("does not load repos when closed", async () => {
    const mocks = createMocks();
    renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: true,
        domain: "example.com",
        ...mocks,
      })
    );

    expect(mocks.getRepos).not.toHaveBeenCalled();
  });

  it("does not load repos when disconnected", async () => {
    const mocks = createMocks();
    renderHook(() =>
      useApplyFixWorkflow({
        isOpen: true,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    expect(mocks.getRepos).not.toHaveBeenCalled();
  });

  it("handles repo load error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mocks = createMocks();
    mocks.getRepos.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: true,
        isConnected: true,
        domain: "example.com",
        ...mocks,
      })
    );

    await waitFor(() => {
      expect(result.current.state.isLoadingRepos).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("setStep changes the step", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setStep("edit");
    });

    expect(result.current.state.step).toBe("edit");
  });

  it("selectRepo updates state and saves to domain", async () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: true,
        isConnected: true,
        domain: "example.com",
        ...mocks,
      })
    );

    await waitFor(() => {
      expect(result.current.state.repos.length).toBe(2);
    });

    act(() => {
      result.current.selectRepo(mockRepo);
    });

    expect(result.current.state.selectedRepo).toEqual(mockRepo);
    expect(mocks.saveRepoForDomain).toHaveBeenCalledWith("example.com", "owner", "test-repo");
  });

  it("showRepoSelector sets showRepoSelector to true", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.showRepoSelector();
    });

    expect(result.current.state.showRepoSelector).toBe(true);
  });

  it("setFilePath updates filePath", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setFilePath("/src/index.ts");
    });

    expect(result.current.state.filePath).toBe("/src/index.ts");
  });

  it("showFileFinder and hideFileFinder toggle showFileFinder", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.showFileFinder();
    });
    expect(result.current.state.showFileFinder).toBe(true);

    act(() => {
      result.current.hideFileFinder();
    });
    expect(result.current.state.showFileFinder).toBe(false);
  });

  it("setFileContent updates fileContent", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setFileContent("const x = 1;");
    });

    expect(result.current.state.fileContent).toBe("const x = 1;");
  });

  it("setLoadingFile updates isLoadingFile", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setLoadingFile(true);
    });

    expect(result.current.state.isLoadingFile).toBe(true);
  });

  it("setLineNumber updates selectedLineNumber", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setLineNumber(42);
    });

    expect(result.current.state.selectedLineNumber).toBe(42);
  });

  it("setCreatingPR updates isCreatingPR", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setCreatingPR(true);
    });

    expect(result.current.state.isCreatingPR).toBe(true);
  });

  it("setPrError updates prError", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setPrError("Failed to create PR");
    });

    expect(result.current.state.prError).toBe("Failed to create PR");
  });

  it("setPrResult updates prResult", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setPrResult({ prUrl: "https://github.com/pr/1", prNumber: 1 });
    });

    expect(result.current.state.prResult).toEqual({
      prUrl: "https://github.com/pr/1",
      prNumber: 1,
    });
  });

  it("setCopied updates copied", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setCopied(true);
    });

    expect(result.current.state.copied).toBe(true);
  });

  it("reset resets state but keeps repos and selectedRepo", async () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: true,
        isConnected: true,
        domain: "example.com",
        ...mocks,
      })
    );

    await waitFor(() => {
      expect(result.current.state.repos.length).toBe(2);
    });

    act(() => {
      result.current.selectRepo(mockRepo);
      result.current.setStep("edit");
      result.current.setFilePath("/src/index.ts");
      result.current.setPrError("Error");
    });

    expect(result.current.state.step).toBe("edit");
    expect(result.current.state.filePath).toBe("/src/index.ts");

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.step).toBe("preview");
    expect(result.current.state.filePath).toBeNull();
    expect(result.current.state.prError).toBeNull();
    expect(result.current.state.repos.length).toBe(2);
    expect(result.current.state.selectedRepo).toEqual(mockRepo);
  });

  it("backToPreview resets step and clears fileContent and prError", () => {
    const mocks = createMocks();
    const { result } = renderHook(() =>
      useApplyFixWorkflow({
        isOpen: false,
        isConnected: false,
        domain: "example.com",
        ...mocks,
      })
    );

    act(() => {
      result.current.setStep("edit");
      result.current.setFileContent("content");
      result.current.setPrError("Error");
    });

    expect(result.current.state.step).toBe("edit");

    act(() => {
      result.current.backToPreview();
    });

    expect(result.current.state.step).toBe("preview");
    expect(result.current.state.fileContent).toBeNull();
    expect(result.current.state.prError).toBeNull();
  });
});
