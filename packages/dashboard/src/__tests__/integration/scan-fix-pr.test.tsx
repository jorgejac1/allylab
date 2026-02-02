// @vitest-environment jsdom
/**
 * Integration tests for the Scan -> Fix -> PR workflow
 * Tests the complete user journey from viewing scan results to creating a PR
 */
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import type { TrackedFinding, SavedScan } from '../../types';
import type { CodeFix } from '../../types/fixes';

// ============================================
// Test Fixtures
// ============================================

const createMockFinding = (overrides: Partial<TrackedFinding> = {}): TrackedFinding => ({
  id: 'finding-1',
  ruleId: 'color-contrast',
  ruleTitle: 'Elements must have sufficient color contrast',
  description: 'The contrast ratio between foreground and background colors should meet WCAG 2 AA minimum ratios',
  impact: 'serious',
  selector: 'button.submit-btn',
  html: '<button class="submit-btn" style="color: #777; background: #eee">Submit</button>',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
  wcagTags: ['wcag2aa', 'wcag143'],
  status: 'new',
  fingerprint: 'fp-12345',
  ...overrides,
});

const createMockScan = (overrides: Partial<SavedScan> = {}): SavedScan => ({
  id: 'scan-1',
  url: 'https://example.com',
  timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
  score: 75,
  totalIssues: 3,
  critical: 0,
  serious: 2,
  moderate: 1,
  minor: 0,
  findings: [],
  scanDuration: 5000,
  trackedFindings: [
    createMockFinding(),
    createMockFinding({
      id: 'finding-2',
      ruleId: 'image-alt',
      ruleTitle: 'Images must have alternate text',
      impact: 'critical',
      selector: 'img.hero-image',
      html: '<img class="hero-image" src="/hero.jpg">',
    }),
    createMockFinding({
      id: 'finding-3',
      ruleId: 'label',
      ruleTitle: 'Form elements must have labels',
      impact: 'moderate',
      selector: 'input#email',
      html: '<input id="email" type="email">',
    }),
  ],
  ...overrides,
});

const createMockCodeFix = (): CodeFix => ({
  id: 'fix-1',
  findingId: 'finding-1',
  ruleId: 'color-contrast',
  original: {
    code: '<button class="submit-btn" style="color: #777; background: #eee">Submit</button>',
    selector: 'button.submit-btn',
    language: 'html',
  },
  fixes: {
    html: '<button class="submit-btn" style="color: #333; background: #eee">Submit</button>',
  },
  diff: '-color: #777\n+color: #333',
  explanation: 'Changed the text color from #777 to #333 to meet WCAG AA contrast requirements.',
  confidence: 'high',
  effort: 'trivial',
  wcagCriteria: ['WCAG 2.1 SC 1.4.3'],
  createdAt: new Date().toISOString(),
});

// ============================================
// Integration Component: Simulates the real workflow
// ============================================

interface WorkflowTestHarnessProps {
  scan: SavedScan;
  onGenerateFix: (finding: TrackedFinding) => Promise<CodeFix>;
  onCreatePR: (findings: TrackedFinding[], fix: CodeFix) => Promise<{ url: string }>;
}

/**
 * A test harness component that simulates the complete workflow
 * This mimics how the real app components work together
 */
function WorkflowTestHarness({ scan, onGenerateFix, onCreatePR }: WorkflowTestHarnessProps) {
  const [selectedFinding, setSelectedFinding] = useState<TrackedFinding | null>(null);
  const [generatedFix, setGeneratedFix] = useState<CodeFix | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [step, setStep] = useState<'list' | 'details' | 'fix' | 'pr'>('list');

  const handleViewDetails = (finding: TrackedFinding) => {
    setSelectedFinding(finding);
    setStep('details');
  };

  const handleGenerateFix = async () => {
    if (!selectedFinding) return;
    setIsGenerating(true);
    try {
      const fix = await onGenerateFix(selectedFinding);
      setGeneratedFix(fix);
      setStep('fix');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreatePR = async () => {
    if (!selectedFinding || !generatedFix) return;
    const result = await onCreatePR([selectedFinding], generatedFix);
    setPrUrl(result.url);
    setStep('pr');
  };

  const handleBack = () => {
    if (step === 'pr') {
      setStep('fix');
      setPrUrl(null);
    } else if (step === 'fix') {
      setStep('details');
      setGeneratedFix(null);
    } else if (step === 'details') {
      setStep('list');
      setSelectedFinding(null);
    }
  };

  return (
    <div data-testid="workflow-harness">
      {/* Step 1: Findings List */}
      {step === 'list' && (
        <div data-testid="findings-list">
          <h2>Scan Results for {scan.url}</h2>
          <p>Score: {scan.score}/100</p>
          <p>{scan.trackedFindings?.length || 0} issues found</p>
          <ul>
            {scan.trackedFindings?.map((finding) => (
              <li key={finding.id}>
                <button
                  onClick={() => handleViewDetails(finding)}
                  data-testid={`view-finding-${finding.id}`}
                >
                  {finding.ruleTitle} ({finding.impact})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 2: Finding Details */}
      {step === 'details' && selectedFinding && (
        <div data-testid="finding-details">
          <button onClick={handleBack} data-testid="back-btn">← Back</button>
          <h2>{selectedFinding.ruleTitle}</h2>
          <p>{selectedFinding.description}</p>
          <code data-testid="element-html">{selectedFinding.html}</code>
          <div>
            <span>Severity: {selectedFinding.impact}</span>
            <span>WCAG: {selectedFinding.wcagTags.join(', ')}</span>
          </div>
          <button
            onClick={handleGenerateFix}
            disabled={isGenerating}
            data-testid="generate-fix-btn"
          >
            {isGenerating ? 'Generating...' : 'Generate AI Fix'}
          </button>
        </div>
      )}

      {/* Step 3: Review Fix */}
      {step === 'fix' && generatedFix && (
        <div data-testid="fix-review">
          <button onClick={handleBack} data-testid="back-btn">← Back</button>
          <h2>Review Fix</h2>
          <div>
            <h3>Original Code</h3>
            <pre data-testid="original-code">{generatedFix.original.code}</pre>
          </div>
          <div>
            <h3>Fixed Code</h3>
            <pre data-testid="fixed-code">{generatedFix.fixes.html}</pre>
          </div>
          <p data-testid="explanation">{generatedFix.explanation}</p>
          <button onClick={handleCreatePR} data-testid="create-pr-btn">
            Create Pull Request
          </button>
        </div>
      )}

      {/* Step 4: PR Created */}
      {step === 'pr' && prUrl && (
        <div data-testid="pr-success">
          <h2>Pull Request Created!</h2>
          <a href={prUrl} data-testid="pr-link">{prUrl}</a>
          <button onClick={handleBack} data-testid="back-btn">Fix Another Issue</button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Integration Tests
// ============================================

describe('Integration: Scan → Fix → PR Workflow', () => {
  const mockGenerateFix = vi.fn();
  const mockCreatePR = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateFix.mockResolvedValue(createMockCodeFix());
    mockCreatePR.mockResolvedValue({ url: 'https://github.com/org/repo/pull/123' });
  });

  it('completes the full workflow: view findings → generate fix → create PR', async () => {
    const scan = createMockScan();

    render(
      <WorkflowTestHarness
        scan={scan}
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // Step 1: View findings list
    expect(screen.getByTestId('findings-list')).toBeInTheDocument();
    expect(screen.getByText('3 issues found')).toBeInTheDocument();
    expect(screen.getByText('Score: 75/100')).toBeInTheDocument();

    // Step 2: Click on a finding to view details
    fireEvent.click(screen.getByTestId('view-finding-finding-1'));

    await waitFor(() => {
      expect(screen.getByTestId('finding-details')).toBeInTheDocument();
    });
    expect(screen.getByText('Elements must have sufficient color contrast')).toBeInTheDocument();
    expect(screen.getByTestId('element-html')).toHaveTextContent('button class="submit-btn"');

    // Step 3: Generate AI fix
    fireEvent.click(screen.getByTestId('generate-fix-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('fix-review')).toBeInTheDocument();
    });
    expect(mockGenerateFix).toHaveBeenCalledWith(scan.trackedFindings![0]);
    expect(screen.getByTestId('original-code')).toHaveTextContent('color: #777');
    expect(screen.getByTestId('fixed-code')).toHaveTextContent('color: #333');
    expect(screen.getByTestId('explanation')).toHaveTextContent('WCAG AA contrast requirements');

    // Step 4: Create PR
    fireEvent.click(screen.getByTestId('create-pr-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('pr-success')).toBeInTheDocument();
    });
    expect(mockCreatePR).toHaveBeenCalled();
    const prLink = screen.getByTestId('pr-link');
    expect(prLink).toHaveAttribute('href', 'https://github.com/org/repo/pull/123');
  });

  it('allows navigation back through the workflow', async () => {
    const scan = createMockScan();

    render(
      <WorkflowTestHarness
        scan={scan}
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // Navigate to details
    fireEvent.click(screen.getByTestId('view-finding-finding-1'));
    await waitFor(() => {
      expect(screen.getByTestId('finding-details')).toBeInTheDocument();
    });

    // Generate fix
    fireEvent.click(screen.getByTestId('generate-fix-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('fix-review')).toBeInTheDocument();
    });

    // Create PR
    fireEvent.click(screen.getByTestId('create-pr-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('pr-success')).toBeInTheDocument();
    });

    // Navigate back to fix review
    fireEvent.click(screen.getByTestId('back-btn'));
    expect(screen.getByTestId('fix-review')).toBeInTheDocument();

    // Navigate back to details
    fireEvent.click(screen.getByTestId('back-btn'));
    expect(screen.getByTestId('finding-details')).toBeInTheDocument();

    // Navigate back to list
    fireEvent.click(screen.getByTestId('back-btn'));
    expect(screen.getByTestId('findings-list')).toBeInTheDocument();
  });

  it('shows loading state during fix generation', async () => {
    const scan = createMockScan();
    let resolveGenerate: (value: CodeFix) => void;
    mockGenerateFix.mockImplementation(() => new Promise(resolve => {
      resolveGenerate = resolve;
    }));

    render(
      <WorkflowTestHarness
        scan={scan}
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // Navigate to details
    fireEvent.click(screen.getByTestId('view-finding-finding-1'));
    await waitFor(() => {
      expect(screen.getByTestId('finding-details')).toBeInTheDocument();
    });

    // Click generate - should show loading
    fireEvent.click(screen.getByTestId('generate-fix-btn'));
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByTestId('generate-fix-btn')).toBeDisabled();

    // Resolve the promise
    resolveGenerate!(createMockCodeFix());
    await waitFor(() => {
      expect(screen.getByTestId('fix-review')).toBeInTheDocument();
    });
  });

  it('handles multiple findings with different severities', async () => {
    const scan = createMockScan();

    render(
      <WorkflowTestHarness
        scan={scan}
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // Check all findings are listed
    expect(screen.getByText(/color contrast/i)).toBeInTheDocument();
    expect(screen.getByText(/alternate text/i)).toBeInTheDocument();
    expect(screen.getByText(/form elements/i)).toBeInTheDocument();

    // Check severity indicators
    expect(screen.getByText(/serious/i)).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText(/moderate/i)).toBeInTheDocument();
  });
});

describe('Integration: Findings Management', () => {
  interface FindingsManagerProps {
    findings: TrackedFinding[];
    onMarkFalsePositive: (finding: TrackedFinding) => void;
    onFilter: (severity: string) => void;
  }

  function FindingsManager({ findings, onMarkFalsePositive, onFilter }: FindingsManagerProps) {
    const [filter, setFilter] = useState<string>('all');
    const [localFindings, setLocalFindings] = useState(findings);

    const handleFilter = (severity: string) => {
      setFilter(severity);
      onFilter(severity);
    };

    const handleMarkFP = (finding: TrackedFinding) => {
      setLocalFindings(prev => prev.map(f =>
        f.id === finding.id ? { ...f, falsePositive: true } : f
      ));
      onMarkFalsePositive(finding);
    };

    const filteredFindings = filter === 'all'
      ? localFindings
      : localFindings.filter(f => f.impact === filter);

    const activeFindings = filteredFindings.filter(f => !f.falsePositive);
    const fpCount = localFindings.filter(f => f.falsePositive).length;

    return (
      <div data-testid="findings-manager">
        <div data-testid="filters">
          <button onClick={() => handleFilter('all')} data-testid="filter-all">All</button>
          <button onClick={() => handleFilter('critical')} data-testid="filter-critical">Critical</button>
          <button onClick={() => handleFilter('serious')} data-testid="filter-serious">Serious</button>
        </div>
        <div data-testid="counts">
          <span data-testid="active-count">{activeFindings.length} active</span>
          <span data-testid="fp-count">{fpCount} false positives</span>
        </div>
        <ul data-testid="findings">
          {filteredFindings.map(finding => (
            <li
              key={finding.id}
              data-testid={`finding-${finding.id}`}
              style={{ opacity: finding.falsePositive ? 0.5 : 1 }}
            >
              <span>{finding.ruleTitle}</span>
              {!finding.falsePositive && (
                <button
                  onClick={() => handleMarkFP(finding)}
                  data-testid={`mark-fp-${finding.id}`}
                >
                  Mark as False Positive
                </button>
              )}
              {finding.falsePositive && <span data-testid="fp-badge">False Positive</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  it('filters findings by severity', async () => {
    const findings = [
      createMockFinding({ id: 'f1', impact: 'critical', ruleTitle: 'Critical Issue' }),
      createMockFinding({ id: 'f2', impact: 'serious', ruleTitle: 'Serious Issue' }),
      createMockFinding({ id: 'f3', impact: 'serious', ruleTitle: 'Another Serious' }),
    ];
    const onFilter = vi.fn();
    const onMarkFP = vi.fn();

    render(
      <FindingsManager
        findings={findings}
        onMarkFalsePositive={onMarkFP}
        onFilter={onFilter}
      />
    );

    // Initially shows all
    expect(screen.getByTestId('active-count')).toHaveTextContent('3 active');
    expect(screen.getAllByTestId(/^finding-/)).toHaveLength(3);

    // Filter to critical only
    fireEvent.click(screen.getByTestId('filter-critical'));
    expect(onFilter).toHaveBeenCalledWith('critical');
    expect(screen.getAllByTestId(/^finding-/)).toHaveLength(1);
    expect(screen.getByText('Critical Issue')).toBeInTheDocument();

    // Filter to serious
    fireEvent.click(screen.getByTestId('filter-serious'));
    expect(screen.getAllByTestId(/^finding-/)).toHaveLength(2);
  });

  it('marks findings as false positives and updates counts', async () => {
    const findings = [
      createMockFinding({ id: 'f1', ruleTitle: 'Issue 1' }),
      createMockFinding({ id: 'f2', ruleTitle: 'Issue 2' }),
    ];
    const onMarkFP = vi.fn();
    const onFilter = vi.fn();

    render(
      <FindingsManager
        findings={findings}
        onMarkFalsePositive={onMarkFP}
        onFilter={onFilter}
      />
    );

    // Initial counts
    expect(screen.getByTestId('active-count')).toHaveTextContent('2 active');
    expect(screen.getByTestId('fp-count')).toHaveTextContent('0 false positives');

    // Mark first as false positive
    fireEvent.click(screen.getByTestId('mark-fp-f1'));

    expect(onMarkFP).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1' }));
    expect(screen.getByTestId('active-count')).toHaveTextContent('1 active');
    expect(screen.getByTestId('fp-count')).toHaveTextContent('1 false positives');

    // Check the finding shows the FP badge
    const finding1 = screen.getByTestId('finding-f1');
    expect(within(finding1).getByTestId('fp-badge')).toBeInTheDocument();
    expect(within(finding1).queryByTestId('mark-fp-f1')).not.toBeInTheDocument();
  });
});

// ============================================
// Error Scenario Tests
// ============================================

describe('Integration: Error Scenarios', () => {
  interface ErrorHarnessProps {
    onGenerateFix: () => Promise<CodeFix | null>;
    onCreatePR: () => Promise<{ url: string } | null>;
  }

  function ErrorHarness({ onGenerateFix, onCreatePR }: ErrorHarnessProps) {
    const [step, setStep] = useState<'start' | 'fix' | 'pr'>('start');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fix, setFix] = useState<CodeFix | null>(null);
    const [prUrl, setPrUrl] = useState<string | null>(null);

    const handleGenerateFix = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await onGenerateFix();
        if (result) {
          setFix(result);
          setStep('fix');
        } else {
          setError('Failed to generate fix. Please try again.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    const handleCreatePR = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await onCreatePR();
        if (result) {
          setPrUrl(result.url);
          setStep('pr');
        } else {
          setError('Failed to create PR. Please check your GitHub settings.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    const handleRetry = () => {
      setError(null);
      if (step === 'fix') {
        handleCreatePR();
      } else {
        handleGenerateFix();
      }
    };

    const handleDismissError = () => {
      setError(null);
    };

    return (
      <div data-testid="error-harness">
        {error && (
          <div data-testid="error-message" role="alert">
            <span>{error}</span>
            <button onClick={handleRetry} data-testid="retry-btn">Retry</button>
            <button onClick={handleDismissError} data-testid="dismiss-btn">Dismiss</button>
          </div>
        )}

        {step === 'start' && (
          <div data-testid="start-step">
            <button
              onClick={handleGenerateFix}
              disabled={isLoading}
              data-testid="generate-btn"
            >
              {isLoading ? 'Loading...' : 'Generate Fix'}
            </button>
          </div>
        )}

        {step === 'fix' && fix && (
          <div data-testid="fix-step">
            <p>Fix generated: {fix.explanation}</p>
            <button
              onClick={handleCreatePR}
              disabled={isLoading}
              data-testid="create-pr-btn"
            >
              {isLoading ? 'Creating...' : 'Create PR'}
            </button>
          </div>
        )}

        {step === 'pr' && prUrl && (
          <div data-testid="success-step">
            <p>PR Created: {prUrl}</p>
          </div>
        )}
      </div>
    );
  }

  it('displays error when fix generation fails with null response', async () => {
    const mockGenerateFix = vi.fn().mockResolvedValue(null);
    const mockCreatePR = vi.fn();

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    fireEvent.click(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    expect(screen.getByText('Failed to generate fix. Please try again.')).toBeInTheDocument();
    expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
  });

  it('displays error when fix generation throws an exception', async () => {
    const mockGenerateFix = vi.fn().mockRejectedValue(new Error('Network timeout'));
    const mockCreatePR = vi.fn();

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    fireEvent.click(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('displays error when PR creation fails with null response', async () => {
    const mockFix = createMockCodeFix();
    const mockGenerateFix = vi.fn().mockResolvedValue(mockFix);
    const mockCreatePR = vi.fn().mockResolvedValue(null);

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // Generate fix first
    fireEvent.click(screen.getByTestId('generate-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('fix-step')).toBeInTheDocument();
    });

    // Try to create PR
    fireEvent.click(screen.getByTestId('create-pr-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    expect(screen.getByText('Failed to create PR. Please check your GitHub settings.')).toBeInTheDocument();
  });

  it('displays error when PR creation throws an exception', async () => {
    const mockFix = createMockCodeFix();
    const mockGenerateFix = vi.fn().mockResolvedValue(mockFix);
    const mockCreatePR = vi.fn().mockRejectedValue(new Error('GitHub API rate limit exceeded'));

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // Generate fix first
    fireEvent.click(screen.getByTestId('generate-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('fix-step')).toBeInTheDocument();
    });

    // Try to create PR
    fireEvent.click(screen.getByTestId('create-pr-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    expect(screen.getByText('GitHub API rate limit exceeded')).toBeInTheDocument();
  });

  it('allows retry after error', async () => {
    const mockFix = createMockCodeFix();
    const mockGenerateFix = vi.fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce(mockFix);
    const mockCreatePR = vi.fn();

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // First attempt fails
    fireEvent.click(screen.getByTestId('generate-btn'));
    await waitFor(() => {
      expect(screen.getByText('Temporary failure')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByTestId('retry-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('fix-step')).toBeInTheDocument();
    });
    expect(mockGenerateFix).toHaveBeenCalledTimes(2);
  });

  it('allows dismissing error message', async () => {
    const mockGenerateFix = vi.fn().mockRejectedValue(new Error('Some error'));
    const mockCreatePR = vi.fn();

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    fireEvent.click(screen.getByTestId('generate-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    // Dismiss error
    fireEvent.click(screen.getByTestId('dismiss-btn'));
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  it('handles non-Error exceptions gracefully', async () => {
    const mockGenerateFix = vi.fn().mockRejectedValue('String error');
    const mockCreatePR = vi.fn();

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    fireEvent.click(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('disables buttons during loading state', async () => {
    let resolveGenerate: (value: CodeFix | null) => void;
    const mockGenerateFix = vi.fn().mockImplementation(() => new Promise(resolve => {
      resolveGenerate = resolve;
    }));
    const mockCreatePR = vi.fn();

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // Click generate
    fireEvent.click(screen.getByTestId('generate-btn'));

    // Button should be disabled and show loading text
    expect(screen.getByTestId('generate-btn')).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Resolve
    resolveGenerate!(createMockCodeFix());
    await waitFor(() => {
      expect(screen.getByTestId('fix-step')).toBeInTheDocument();
    });
  });

  it('clears previous error on new attempt', async () => {
    const mockFix = createMockCodeFix();
    const mockGenerateFix = vi.fn()
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(mockFix);
    const mockCreatePR = vi.fn();

    render(
      <ErrorHarness
        onGenerateFix={mockGenerateFix}
        onCreatePR={mockCreatePR}
      />
    );

    // First attempt fails
    fireEvent.click(screen.getByTestId('generate-btn'));
    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Retry succeeds
    fireEvent.click(screen.getByTestId('retry-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('fix-step')).toBeInTheDocument();
  });
});

describe('Integration: Network Error Recovery', () => {
  interface NetworkHarnessProps {
    fetchData: () => Promise<{ data: string }>;
  }

  function NetworkHarness({ fetchData }: NetworkHarnessProps) {
    const [data, setData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const handleFetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchData();
        setData(result.data);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes('timeout')) {
            setError('Request timed out. Check your connection.');
          } else if (err.message.includes('401') || err.message.includes('403')) {
            setError('Authentication failed. Please reconnect.');
          } else if (err.message.includes('404')) {
            setError('Resource not found.');
          } else if (err.message.includes('500')) {
            setError('Server error. Please try again later.');
          } else {
            setError(err.message);
          }
        } else {
          setError('Unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleRetry = async () => {
      setRetryCount(prev => prev + 1);
      await handleFetch();
    };

    return (
      <div data-testid="network-harness">
        <button onClick={handleFetch} disabled={isLoading} data-testid="fetch-btn">
          {isLoading ? 'Loading...' : 'Fetch Data'}
        </button>

        {error && (
          <div data-testid="error-container" role="alert">
            <span data-testid="error-text">{error}</span>
            <button onClick={handleRetry} data-testid="retry-btn">
              Retry ({retryCount})
            </button>
          </div>
        )}

        {data && <div data-testid="data-display">{data}</div>}
      </div>
    );
  }

  it('handles timeout errors with friendly message', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Request timeout'));

    render(<NetworkHarness fetchData={mockFetch} />);
    fireEvent.click(screen.getByTestId('fetch-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-text')).toHaveTextContent('Request timed out');
    });
  });

  it('handles authentication errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('401 Unauthorized'));

    render(<NetworkHarness fetchData={mockFetch} />);
    fireEvent.click(screen.getByTestId('fetch-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-text')).toHaveTextContent('Authentication failed');
    });
  });

  it('handles 404 not found errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('404 Not Found'));

    render(<NetworkHarness fetchData={mockFetch} />);
    fireEvent.click(screen.getByTestId('fetch-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-text')).toHaveTextContent('Resource not found');
    });
  });

  it('handles server errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'));

    render(<NetworkHarness fetchData={mockFetch} />);
    fireEvent.click(screen.getByTestId('fetch-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-text')).toHaveTextContent('Server error');
    });
  });

  it('tracks retry count', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: 'Success!' });

    render(<NetworkHarness fetchData={mockFetch} />);

    // First attempt
    fireEvent.click(screen.getByTestId('fetch-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('retry-btn')).toHaveTextContent('Retry (0)');
    });

    // First retry
    fireEvent.click(screen.getByTestId('retry-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('retry-btn')).toHaveTextContent('Retry (1)');
    });

    // Second retry succeeds
    fireEvent.click(screen.getByTestId('retry-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('data-display')).toHaveTextContent('Success!');
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('recovers successfully after multiple failures', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce({ data: 'Finally worked!' });

    render(<NetworkHarness fetchData={mockFetch} />);

    fireEvent.click(screen.getByTestId('fetch-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('error-container')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('retry-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('data-display')).toHaveTextContent('Finally worked!');
    });
    expect(screen.queryByTestId('error-container')).not.toBeInTheDocument();
  });
});
