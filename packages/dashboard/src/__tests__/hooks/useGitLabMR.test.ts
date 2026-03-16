/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUseGitLab = vi.hoisted(() => vi.fn());
vi.mock('../../hooks/useGitLab', () => ({ useGitLab: mockUseGitLab }));

const mockTrackMR = vi.hoisted(() => vi.fn());
const mockGetTrackedMRs = vi.hoisted(() => vi.fn());
const mockGetMRForFinding = vi.hoisted(() => vi.fn());
const mockUpdateMRVerification = vi.hoisted(() => vi.fn());
vi.mock('../../utils/gitlabTracking', () => ({
  trackMR: mockTrackMR,
  getTrackedMRs: mockGetTrackedMRs,
  getMRForFinding: mockGetMRForFinding,
  updateMRVerification: mockUpdateMRVerification,
}));

const mockGetApiBase = vi.hoisted(() => vi.fn(() => 'http://localhost:3001/api'));
vi.mock('../../utils/api', () => ({ getApiBase: mockGetApiBase }));

// ── Import under test ──────────────────────────────────────────────────────────

import { useGitLabMR } from '../../hooks/useGitLabMR';

// ── Helpers ────────────────────────────────────────────────────────────────────

const defaultGitLab = () => ({
  connection: { connected: false },
  isLoading: false,
  error: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  getProjects: vi.fn(),
  getBranches: vi.fn(),
  createMR: vi.fn(),
  searchCode: vi.fn(),
  getProjectTree: vi.fn(),
  getFileContent: vi.fn(),
});

const trackedMR = () => ({
  id: 'mr_1_123',
  findingIds: ['f1', 'f2'],
  projectPath: 'group/project',
  mrIid: 1,
  mrUrl: 'https://gitlab.com/group/project/-/merge_requests/1',
  sourceBranch: 'fix/a11y',
  targetBranch: 'main',
  status: 'merged' as const,
  createdAt: '2024-01-01',
  scanUrl: 'https://example.com',
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('hooks/useGitLabMR', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    mockUseGitLab.mockReturnValue(defaultGitLab());
    mockGetTrackedMRs.mockReturnValue([]);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('initializes with tracked MRs from storage', () => {
    const mrs = [trackedMR()];
    mockGetTrackedMRs.mockReturnValue(mrs);

    const { result } = renderHook(() => useGitLabMR());

    expect(result.current.trackedMRs).toEqual(mrs);
    expect(mockGetTrackedMRs).toHaveBeenCalled();
  });

  it('getMRForFinding() delegates to util', () => {
    const mr = trackedMR();
    mockGetMRForFinding.mockReturnValue(mr);

    const { result } = renderHook(() => useGitLabMR());
    const found = result.current.getMRForFinding('f1');

    expect(mockGetMRForFinding).toHaveBeenCalledWith('f1');
    expect(found).toEqual(mr);
  });

  it('createTrackedMR() calls gitlab.createMR and trackMR on success', async () => {
    const gitlab = defaultGitLab();
    gitlab.createMR.mockResolvedValue({
      success: true,
      mr: {
        iid: 42,
        web_url: 'https://gitlab.com/g/p/-/merge_requests/42',
        source_branch: 'fix/a11y',
        target_branch: 'main',
        state: 'opened',
        created_at: '2024-06-01',
      },
    });
    mockUseGitLab.mockReturnValue(gitlab);

    const { result } = renderHook(() => useGitLabMR());

    const fixes = [
      {
        filePath: 'index.html',
        originalContent: '<div></div>',
        fixedContent: '<div role="main"></div>',
        findingId: 'f1',
        ruleTitle: 'landmark',
      },
    ];

    await act(async () => {
      await result.current.createTrackedMR(
        'group/project',
        'main',
        fixes,
        'Fix a11y issues',
        'Fixes landmark role',
      );
    });

    expect(gitlab.createMR).toHaveBeenCalledWith(
      'group/project',
      'main',
      fixes,
      'Fix a11y issues',
      'Fixes landmark role',
      undefined,
    );
    expect(mockTrackMR).toHaveBeenCalledWith(
      expect.objectContaining({
        findingIds: ['f1'],
        projectPath: 'group/project',
        mrIid: 42,
        mrUrl: 'https://gitlab.com/g/p/-/merge_requests/42',
        sourceBranch: 'fix/a11y',
        targetBranch: 'main',
        status: 'opened',
      }),
    );
  });

  it('verifyFixes() sends POST to /gitlab/verify with correct body', async () => {
    const mr = trackedMR();
    mockGetTrackedMRs.mockReturnValue([mr]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          allFixed: true,
          findingsVerified: [],
        }),
    });

    const { result } = renderHook(() => useGitLabMR());

    await act(async () => {
      await result.current.verifyFixes('mr_1_123');
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/gitlab/verify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com',
          findingIds: ['f1', 'f2'],
          mrIid: 1,
          projectPath: 'group/project',
          standard: undefined,
          viewport: undefined,
        }),
      }),
    );
  });

  it('verifyFixes() updates MR verification status on success', async () => {
    const mr = trackedMR();
    mockGetTrackedMRs.mockReturnValue([mr]);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          allFixed: true,
          findingsVerified: [],
        }),
    });

    const { result } = renderHook(() => useGitLabMR());

    await act(async () => {
      const res = await result.current.verifyFixes('mr_1_123');
      expect(res).toEqual(
        expect.objectContaining({ success: true, allFixed: true }),
      );
    });

    expect(mockUpdateMRVerification).toHaveBeenCalledWith(
      'mr_1_123',
      'verified',
      expect.any(String),
    );
  });

  it('verifyFixes() sets verifyingMRId during verification', async () => {
    const mr = trackedMR();
    mockGetTrackedMRs.mockReturnValue([mr]);

    let resolveVerify!: (value: unknown) => void;
    globalThis.fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveVerify = resolve;
      }),
    );

    const { result } = renderHook(() => useGitLabMR());

    let verifyPromise: Promise<unknown>;
    act(() => {
      verifyPromise = result.current.verifyFixes('mr_1_123');
    });

    // While verification is in flight, the state should reflect it
    expect(result.current.isVerifying).toBe(true);
    expect(result.current.verifyingMRId).toBe('mr_1_123');

    await act(async () => {
      resolveVerify({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            allFixed: true,
            findingsVerified: [],
          }),
      });
      await verifyPromise;
    });

    expect(result.current.isVerifying).toBe(false);
    expect(result.current.verifyingMRId).toBeNull();
  });

  it('verifyFixes() returns null on fetch error', async () => {
    const mr = trackedMR();
    mockGetTrackedMRs.mockReturnValue([mr]);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGitLabMR());

    let res: unknown;
    await act(async () => {
      res = await result.current.verifyFixes('mr_1_123');
    });

    expect(res).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('verifyFixes() returns null when MR tracking ID not found', async () => {
    mockGetTrackedMRs.mockReturnValue([]);

    const { result } = renderHook(() => useGitLabMR());

    let res: unknown;
    await act(async () => {
      res = await result.current.verifyFixes('nonexistent_id');
    });

    expect(res).toBeNull();
  });

  it('checkMRStatus() returns MR state from API', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ state: 'merged' }),
    });

    const { result } = renderHook(() => useGitLabMR());

    let state: string | null = null;
    await act(async () => {
      state = await result.current.checkMRStatus('group/project', 1);
    });

    expect(state).toBe('merged');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/gitlab/projects/group%2Fproject/mr/1',
    );
  });

  it('checkMRStatus() returns null when API response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() => useGitLabMR());

    let state: string | null = null;
    await act(async () => {
      state = await result.current.checkMRStatus('group/project', 1);
    });

    expect(state).toBeNull();
  });

  it('checkMRStatus() returns null on fetch error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useGitLabMR());

    let state: string | null = null;
    await act(async () => {
      state = await result.current.checkMRStatus('group/project', 1);
    });

    expect(state).toBeNull();
  });
});
