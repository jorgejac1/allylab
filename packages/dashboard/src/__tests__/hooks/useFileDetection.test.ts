// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFileDetection } from '../../hooks/useFileDetection';
import type { GitHubRepo } from '../../types/github';
import type { FindingWithFix } from '../../types/batch-pr';

// Mock the utils
vi.mock('../../components/findings/apply-fix/utils', () => ({
  extractTextContent: vi.fn((html: string) => {
    const match = html.match(/>([^<]+)</);
    return match ? match[1] : null;
  }),
  findCodeInJsx: vi.fn(() => ({
    confidence: 'high' as const,
    reason: 'Exact match found',
    lineStart: 10,
  })),
}));

const createMockRepo = (): GitHubRepo => ({
  id: 1,
  name: 'test-repo',
  full_name: 'owner/test-repo',
  owner: { login: 'owner', avatar_url: 'https://example.com/avatar.png' },
  default_branch: 'main',
  private: false,
  html_url: 'https://github.com/owner/test-repo',
});

const createMockFinding = (overrides: Partial<FindingWithFix> = {}): FindingWithFix => ({
  finding: {
    id: 'finding-1',
    ruleId: 'color-contrast',
    ruleTitle: 'Color contrast issue',
    description: 'Insufficient contrast',
    impact: 'serious',
    selector: 'button.submit-button',
    html: '<button class="submit-button">Submit</button>',
    helpUrl: '',
    wcagTags: [],
    status: 'new',
    fingerprint: 'fp-1',
  },
  fix: {
    id: 'fix-1',
    findingId: 'finding-1',
    ruleId: 'color-contrast',
    original: {
      code: '<button class="submit-button">Submit</button>',
      selector: 'button.submit-button',
      language: 'html',
    },
    fixes: {
      html: '<button class="submit-button" style="color: #000">Submit</button>',
    },
    diff: '',
    explanation: 'Fixed contrast',
    confidence: 'high',
    effort: 'trivial',
    wcagCriteria: [],
    createdAt: new Date().toISOString(),
  },
  filePath: '',
  isGenerating: false,
  error: null,
  ...overrides,
});

describe('useFileDetection', () => {
  const mockSearchCode = vi.fn();
  const mockGetFileContent = vi.fn();
  const mockOnFilePathChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty detection states', () => {
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [],
        onFilePathChange: mockOnFilePathChange,
      })
    );

    expect(result.current.detectionStates).toEqual({});
    expect(result.current.isAutoDetecting).toBe(false);
    expect(result.current.hasSearchCapability).toBe(false);
  });

  it('has search capability when searchCode and getFileContent are provided', () => {
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    expect(result.current.hasSearchCapability).toBe(true);
  });

  it('does not have search capability when only searchCode is provided', () => {
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
      })
    );

    expect(result.current.hasSearchCapability).toBe(false);
  });

  it('toggles preview state for a finding', () => {
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [],
        onFilePathChange: mockOnFilePathChange,
      })
    );

    act(() => {
      result.current.togglePreview('finding-1');
    });

    expect(result.current.detectionStates['finding-1']?.showPreview).toBe(true);

    act(() => {
      result.current.togglePreview('finding-1');
    });

    expect(result.current.detectionStates['finding-1']?.showPreview).toBe(false);
  });

  it('detects file and updates state on success', async () => {
    mockSearchCode.mockResolvedValue([{ path: 'src/components/Button.tsx' }]);
    mockGetFileContent.mockResolvedValue('const Button = () => <button>Submit</button>');

    const finding = createMockFinding();
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    expect(mockSearchCode).toHaveBeenCalledWith('owner', 'test-repo', 'Submit');
    expect(mockGetFileContent).toHaveBeenCalledWith('owner', 'test-repo', 'src/components/Button.tsx', 'main');
    expect(mockOnFilePathChange).toHaveBeenCalledWith(0, 'src/components/Button.tsx');
    expect(result.current.detectionStates['finding-1']?.result?.confidence).toBe('high');
  });

  it('returns early if searchCode is not provided', async () => {
    const finding = createMockFinding();
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    expect(mockOnFilePathChange).not.toHaveBeenCalled();
  });

  it('returns early if finding has no fix', async () => {
    const finding = createMockFinding({ fix: undefined });
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    expect(mockSearchCode).not.toHaveBeenCalled();
  });

  it('handles no searchable content found', async () => {
    const finding = createMockFinding({
      finding: {
        ...createMockFinding().finding,
        selector: 'div',
      },
      fix: {
        ...createMockFinding().fix!,
        original: {
          code: '<div></div>',
          selector: 'div',
          language: 'html',
        },
      },
    });

    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    expect(result.current.detectionStates['finding-1']?.result?.reason).toBe('No searchable content found');
  });

  it('handles no matching files found', async () => {
    mockSearchCode.mockResolvedValue([]);

    const finding = createMockFinding();
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    expect(result.current.detectionStates['finding-1']?.result?.reason).toBe('No matching files found');
    expect(mockOnFilePathChange).not.toHaveBeenCalled();
  });

  it('filters out test files and node_modules', async () => {
    mockSearchCode.mockResolvedValue([
      { path: 'node_modules/package/index.js' },
      { path: 'src/Button.test.tsx' },
      { path: 'src/Button.spec.tsx' },
      { path: 'src/Button.tsx' },
    ]);
    mockGetFileContent.mockResolvedValue('export const Button = () => {}');

    const finding = createMockFinding();
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    expect(mockGetFileContent).toHaveBeenCalledWith('owner', 'test-repo', 'src/Button.tsx', 'main');
  });

  it('handles search error gracefully', async () => {
    mockSearchCode.mockRejectedValue(new Error('API error'));

    const finding = createMockFinding();
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    expect(result.current.detectionStates['finding-1']?.isDetecting).toBe(false);
    expect(result.current.detectionStates['finding-1']?.result?.reason).toBe('No matching files found');
  });

  it('handles detection error gracefully', async () => {
    // Simulate a synchronous throw during the loop (not during await)
    let callCount = 0;
    mockSearchCode.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Unexpected error');
      }
      return Promise.resolve([]);
    });

    const finding = createMockFinding();
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    // After errors are caught, detection should complete with no match found
    expect(result.current.detectionStates['finding-1']?.isDetecting).toBe(false);
    expect(result.current.detectionStates['finding-1']?.result?.reason).toBe('No matching files found');
  });

  it('auto-detects all files without paths', async () => {
    mockSearchCode.mockResolvedValue([{ path: 'src/Button.tsx' }]);
    mockGetFileContent.mockResolvedValue('export const Button = () => {}');

    const findings = [
      createMockFinding({ finding: { ...createMockFinding().finding, id: 'f1' } }),
      createMockFinding({
        finding: { ...createMockFinding().finding, id: 'f2' },
        filePath: 'already/set.tsx' // This one should be skipped
      }),
      createMockFinding({ finding: { ...createMockFinding().finding, id: 'f3' } }),
    ];

    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings,
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.handleAutoDetectAll();
    });

    // Should have been called for f1 and f3, but not f2
    expect(mockOnFilePathChange).toHaveBeenCalledTimes(2);
  });

  it('sets isAutoDetecting during auto-detect', async () => {
    mockSearchCode.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 50)));

    const findings = [createMockFinding()];
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings,
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    let autoDetectPromise: Promise<void>;
    act(() => {
      autoDetectPromise = result.current.handleAutoDetectAll();
    });

    expect(result.current.isAutoDetecting).toBe(true);

    await act(async () => {
      await autoDetectPromise;
    });

    expect(result.current.isAutoDetecting).toBe(false);
  });

  it('calculates high confidence mappings correctly', () => {
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [],
        onFilePathChange: mockOnFilePathChange,
      })
    );

    // Set up detection states with different confidences
    act(() => {
      result.current.togglePreview('f1'); // Creates state for f1
      result.current.togglePreview('f2'); // Creates state for f2
    });

    const findings: FindingWithFix[] = [
      createMockFinding({ finding: { ...createMockFinding().finding, id: 'f1' }, filePath: 'path1.tsx' }),
      createMockFinding({ finding: { ...createMockFinding().finding, id: 'f2' }, filePath: 'path2.tsx' }),
      createMockFinding({ finding: { ...createMockFinding().finding, id: 'f3' }, filePath: '' }), // No path
    ];

    // Initially no high confidence
    expect(result.current.getMappedWithHighConfidence(findings)).toBe(0);
  });

  it('uses selector classes for search queries', async () => {
    mockSearchCode.mockResolvedValue([{ path: 'src/Component.tsx' }]);
    mockGetFileContent.mockResolvedValue('export const Component = () => {}');

    const finding = createMockFinding({
      finding: {
        ...createMockFinding().finding,
        selector: '.significant-class-name .another-class',
      },
      fix: {
        ...createMockFinding().fix!,
        original: {
          code: '<div></div>', // No text content
          selector: '.significant-class-name',
          language: 'html',
        },
      },
    });

    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    // Should have tried class-based search
    expect(mockSearchCode).toHaveBeenCalled();
  });

  it('handles file content being null', async () => {
    mockSearchCode.mockResolvedValue([{ path: 'src/Button.tsx' }]);
    mockGetFileContent.mockResolvedValue(null);

    const finding = createMockFinding();
    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings: [finding],
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.detectFile(finding, 0);
    });

    expect(result.current.detectionStates['finding-1']?.result?.reason).toBe('No matching files found');
  });

  it('skips findings without fix during auto-detect', async () => {
    const findings = [
      createMockFinding({ fix: undefined }),
    ];

    const { result } = renderHook(() =>
      useFileDetection({
        selectedRepo: createMockRepo(),
        selectedBranch: 'main',
        findings,
        onFilePathChange: mockOnFilePathChange,
        searchCode: mockSearchCode,
        getFileContent: mockGetFileContent,
      })
    );

    await act(async () => {
      await result.current.handleAutoDetectAll();
    });

    expect(mockSearchCode).not.toHaveBeenCalled();
  });
});
