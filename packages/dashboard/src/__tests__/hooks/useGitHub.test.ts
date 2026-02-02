import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useGitHub } from "../../hooks/useGitHub";
import type { PRResult } from "../../types/github";

const mockGetApiBase = vi.hoisted(() => vi.fn());
vi.mock("../../utils/api", () => ({ getApiBase: mockGetApiBase }));

describe("hooks/useGitHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiBase.mockReturnValue("http://api");
  });

  it("checks connection and handles errors", async () => {
    const okResponse: { ok?: boolean; json: () => Promise<unknown> } = { json: vi.fn().mockResolvedValue({ connected: true }) };
    const fetchMock = vi.fn(async () => okResponse);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { result } = renderHook(() => useGitHub());
    await act(async () => {});
    expect(result.current.connection.connected).toBe(true);

    globalThis.fetch = vi.fn(async () => {
      throw new Error("fail");
    }) as unknown as typeof fetch;
    await act(async () => {
      await result.current.checkConnection();
    });
    expect(result.current.connection.connected).toBe(false);
    expect(result.current.error).toBe("Failed to check GitHub connection");
  });

  it("connects, disconnects, fetches repos/branches, and creates PR", async () => {
    const okFetch = vi.fn(async () => ({ ok: true, json: vi.fn().mockResolvedValue({ connected: true }) }));
    globalThis.fetch = okFetch as unknown as typeof fetch;
    const { result } = renderHook(() => useGitHub());
    await act(async () => {
      const connected = await result.current.connect("token");
      expect(connected).toBe(true);
    });

    globalThis.fetch = vi.fn(async () => ({ ok: true })) as unknown as typeof fetch;
    await act(async () => {
      await result.current.disconnect();
    });
    expect(result.current.connection.connected).toBe(false);

    globalThis.fetch = vi.fn(async () => ({ ok: true, json: vi.fn().mockResolvedValue([{ name: "r1" }]) })) as unknown as typeof fetch;
    expect((await result.current.getRepos()).length).toBe(1);
    expect((await result.current.getBranches("o", "r")).length).toBe(1);

    globalThis.fetch = vi.fn(async () => ({ json: vi.fn().mockResolvedValue({ success: true } as PRResult) })) as unknown as typeof fetch;
    const pr = await result.current.createPR("o", "r", "main", [], "t", "d");
    expect(pr.success).toBe(true);
  });

  it("handles failures for connect, repos/branches, disconnect, and createPR", async () => {
    const { result } = renderHook(() => useGitHub());

    // connect API error
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "bad connect" }),
    })) as unknown as typeof fetch;
    await act(async () => {
      const connected = await result.current.connect("token");
      expect(connected).toBe(false);
    });
    expect(result.current.error).toBe("bad connect");

    // connect network error
    globalThis.fetch = vi.fn(async () => {
      throw new Error("net down");
    }) as unknown as typeof fetch;
    await act(async () => {
      const connected = await result.current.connect("token");
      expect(connected).toBe(false);
    });
    expect(result.current.error).toBe("Failed to connect to GitHub");

    // disconnect failure
    globalThis.fetch = vi.fn(async () => {
      throw new Error("cannot");
    }) as unknown as typeof fetch;
    await act(async () => {
      await result.current.disconnect();
    });
    expect(result.current.error).toBe("Failed to disconnect");

    // repos non-ok and network errors
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
    const reposFail = await result.current.getRepos();
    expect(reposFail).toEqual([]);
    globalThis.fetch = vi.fn(async () => {
      throw new Error("repo net");
    }) as unknown as typeof fetch;
    const reposNet = await result.current.getRepos();
    expect(reposNet).toEqual([]);

    // branches non-ok and network errors
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 400 })) as unknown as typeof fetch;
    const branchesFail = await result.current.getBranches("o", "r");
    expect(branchesFail).toEqual([]);
    globalThis.fetch = vi.fn(async () => {
      throw new Error("branch net");
    }) as unknown as typeof fetch;
    const branchesNet = await result.current.getBranches("o", "r");
    expect(branchesNet).toEqual([]);

    // createPR failure paths
    globalThis.fetch = vi.fn(async () => ({
      json: vi.fn().mockResolvedValue({ success: false, error: "bad pr" } as PRResult),
    })) as unknown as typeof fetch;
    const prBad = await result.current.createPR("o", "r", "main", [], "t", "d");
    expect(prBad.success).toBe(false);
    expect(prBad.error).toBe("bad pr");

    globalThis.fetch = vi.fn(async () => {
      throw new Error("pr net");
    }) as unknown as typeof fetch;
    const prNet = await result.current.createPR("o", "r", "main", [], "t", "d");
    expect(prNet.success).toBe(false);
    expect(prNet.error).toBe("Failed to create PR");
  });

  it("handles non-Error throws with default messages across helpers", async () => {
    // checkConnection non-Error -> Unknown error
    globalThis.fetch = vi.fn(async () => {
      throw "fail";
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useGitHub());
    await act(async () => {});
    expect(result.current.error).toBe("Failed to check GitHub connection");

    // connect non-Error path uses Network error message internally but exposes generic failure
    globalThis.fetch = vi.fn(async () => {
      throw "connect boom";
    }) as unknown as typeof fetch;
    await act(async () => {
      const connected = await result.current.connect("token");
      expect(connected).toBe(false);
    });
    expect(result.current.error).toBe("Failed to connect to GitHub");

    // getRepos non-Error -> Network error branch
    globalThis.fetch = vi.fn(async () => {
      throw "repos boom";
    }) as unknown as typeof fetch;
    const repos = await result.current.getRepos();
    expect(repos).toEqual([]);

    // getBranches non-Error -> Network error branch
    globalThis.fetch = vi.fn(async () => {
      throw "branches boom";
    }) as unknown as typeof fetch;
    const branches = await result.current.getBranches("o", "r");
    expect(branches).toEqual([]);

    // createPR non-Error -> returns fallback error
    globalThis.fetch = vi.fn(async () => {
      throw "pr boom";
    }) as unknown as typeof fetch;
    const prRes = await result.current.createPR("o", "r", "main", [], "t", "d");
    expect(prRes.success).toBe(false);
    expect(prRes.error).toBe("Failed to create PR");
  });

  it("defaults connect error message and handles disconnect unknown error", async () => {
    const { result } = renderHook(() => useGitHub());

    // connect without error message -> Failed to connect
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    })) as unknown as typeof fetch;
    await act(async () => {
      const connected = await result.current.connect("token");
      expect(connected).toBe(false);
    });
    expect(result.current.error).toBe("Failed to connect");

    // disconnect throwing non-Error -> logs Unknown error, sets Failed to disconnect
    globalThis.fetch = vi.fn(async () => {
      throw "boom";
    }) as unknown as typeof fetch;
    await act(async () => {
      await result.current.disconnect();
    });
    expect(result.current.error).toBe("Failed to disconnect");
  });

  it("searches code in repo", async () => {
    const { result } = renderHook(() => useGitHub());

    // successful search
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: vi.fn().mockResolvedValue([{ path: "src/test.ts" }]),
    })) as unknown as typeof fetch;
    const searchResults = await result.current.searchCode("owner", "repo", "query");
    expect(searchResults).toEqual([{ path: "src/test.ts" }]);

    // search failure
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "Search failed" }),
    })) as unknown as typeof fetch;
    await expect(result.current.searchCode("owner", "repo", "query")).rejects.toThrow("Search failed");

    // search failure without error message
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    })) as unknown as typeof fetch;
    await expect(result.current.searchCode("owner", "repo", "query")).rejects.toThrow("Search failed");
  });

  it("gets repo tree", async () => {
    const { result } = renderHook(() => useGitHub());

    // successful get tree
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: vi.fn().mockResolvedValue([{ path: "src", type: "dir" }]),
    })) as unknown as typeof fetch;
    const tree = await result.current.getRepoTree("owner", "repo");
    expect(tree).toEqual([{ path: "src", type: "dir" }]);

    // get tree with branch
    await result.current.getRepoTree("owner", "repo", "main");
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("?branch=main"));

    // get tree failure
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "Tree error" }),
    })) as unknown as typeof fetch;
    await expect(result.current.getRepoTree("owner", "repo")).rejects.toThrow("Tree error");

    // get tree failure without error message
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    })) as unknown as typeof fetch;
    await expect(result.current.getRepoTree("owner", "repo")).rejects.toThrow("Failed to fetch files");
  });

  it("gets file content", async () => {
    const { result } = renderHook(() => useGitHub());

    // successful get file content
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: vi.fn().mockResolvedValue({ content: "file content" }),
    })) as unknown as typeof fetch;
    const content = await result.current.getFileContent("owner", "repo", "path/to/file.ts");
    expect(content).toBe("file content");

    // get file content with branch
    await result.current.getFileContent("owner", "repo", "path/to/file.ts", "develop");
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("&branch=develop"));

    // get file content - no content field
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    })) as unknown as typeof fetch;
    const noContent = await result.current.getFileContent("owner", "repo", "path");
    expect(noContent).toBeNull();

    // get file content failure - non-ok response
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 404,
    })) as unknown as typeof fetch;
    const notFound = await result.current.getFileContent("owner", "repo", "missing.ts");
    expect(notFound).toBeNull();

    // get file content network error
    globalThis.fetch = vi.fn(async () => {
      throw new Error("Network error");
    }) as unknown as typeof fetch;
    const netError = await result.current.getFileContent("owner", "repo", "file.ts");
    expect(netError).toBeNull();

    // get file content non-Error throw
    globalThis.fetch = vi.fn(async () => {
      throw "string error";
    }) as unknown as typeof fetch;
    const strError = await result.current.getFileContent("owner", "repo", "file.ts");
    expect(strError).toBeNull();
  });

  it("creates PR with custom branch name", async () => {
    const { result } = renderHook(() => useGitHub());

    globalThis.fetch = vi.fn(async () => ({
      json: vi.fn().mockResolvedValue({ success: true, url: "https://github.com/pr/1" }),
    })) as unknown as typeof fetch;

    const pr = await result.current.createPR(
      "owner",
      "repo",
      "main",
      [{ filePath: "test.ts", originalContent: "old", fixedContent: "new", findingId: "1", ruleTitle: "Test" }],
      "My PR Title",
      "PR Description",
      "custom-branch-name"
    );

    expect(pr.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("custom-branch-name"),
      })
    );
  });
});
