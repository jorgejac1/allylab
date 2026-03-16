/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUsePlanLimits = vi.hoisted(() => vi.fn());
vi.mock('../../hooks', () => ({ usePlanLimits: mockUsePlanLimits }));

// ── Imports under test ─────────────────────────────────────────────────────────

import { PlanGate } from '../../components/guards/PlanGate';
import { UpgradePrompt } from '../../components/guards/UpgradePrompt';

// ── Helpers ────────────────────────────────────────────────────────────────────

const allAllowed = () => ({
  plan: 'pro',
  canScan: true,
  canGenerateFix: true,
  canCreatePR: true,
  canUseSchedules: true,
  canUseCustomRules: true,
  canUseJira: true,
  canExport: () => true,
  remainingScans: Infinity,
  remainingFixes: Infinity,
  remainingPRs: Infinity,
  incrementScanCount: vi.fn(),
  incrementFixCount: vi.fn(),
  incrementPRCount: vi.fn(),
});

const noneAllowed = () => ({
  plan: 'free',
  canScan: false,
  canGenerateFix: false,
  canCreatePR: false,
  canUseSchedules: false,
  canUseCustomRules: false,
  canUseJira: false,
  canExport: () => false,
  remainingScans: 0,
  remainingFixes: 0,
  remainingPRs: 0,
  incrementScanCount: vi.fn(),
  incrementFixCount: vi.fn(),
  incrementPRCount: vi.fn(),
});

// ── Tests: PlanGate ────────────────────────────────────────────────────────────

describe('components/guards/PlanGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children when feature is allowed (canScan: true)', () => {
    mockUsePlanLimits.mockReturnValue(allAllowed());

    render(
      <PlanGate feature="scan">
        <div>Scan Content</div>
      </PlanGate>,
    );

    expect(screen.getByText('Scan Content')).toBeInTheDocument();
  });

  it('renders UpgradePrompt when feature is not allowed (canScan: false)', () => {
    mockUsePlanLimits.mockReturnValue(noneAllowed());

    render(
      <PlanGate feature="scan">
        <div>Scan Content</div>
      </PlanGate>,
    );

    expect(screen.queryByText('Scan Content')).not.toBeInTheDocument();
    expect(screen.getByText('Scan limit reached')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Pro to unlock/)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    mockUsePlanLimits.mockReturnValue(noneAllowed());

    render(
      <PlanGate feature="scan" fallback={<div>Custom Fallback</div>}>
        <div>Scan Content</div>
      </PlanGate>,
    );

    expect(screen.queryByText('Scan Content')).not.toBeInTheDocument();
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });

  describe('handles each feature type', () => {
    const featureMap: {
      feature: 'scan' | 'ai-fix' | 'pr' | 'schedules' | 'custom-rules' | 'jira';
      limitKey: string;
      label: string;
    }[] = [
      { feature: 'scan', limitKey: 'canScan', label: 'Scan limit reached' },
      { feature: 'ai-fix', limitKey: 'canGenerateFix', label: 'AI fix limit reached' },
      { feature: 'pr', limitKey: 'canCreatePR', label: 'PR creation limit reached' },
      { feature: 'schedules', limitKey: 'canUseSchedules', label: 'Scheduled scans' },
      { feature: 'custom-rules', limitKey: 'canUseCustomRules', label: 'Custom rules' },
      { feature: 'jira', limitKey: 'canUseJira', label: 'JIRA integration' },
    ];

    featureMap.forEach(({ feature, limitKey, label }) => {
      it(`blocks "${feature}" when ${limitKey} is false`, () => {
        mockUsePlanLimits.mockReturnValue(noneAllowed());

        render(
          <PlanGate feature={feature}>
            <div>Protected Content</div>
          </PlanGate>,
        );

        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText(label)).toBeInTheDocument();

        cleanup();
      });

      it(`allows "${feature}" when ${limitKey} is true`, () => {
        mockUsePlanLimits.mockReturnValue(allAllowed());

        render(
          <PlanGate feature={feature}>
            <div>Protected Content</div>
          </PlanGate>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();

        cleanup();
      });
    });

    it('blocks "export-pdf" when canExport returns false', () => {
      const limits = allAllowed();
      limits.canExport = () => false;
      mockUsePlanLimits.mockReturnValue(limits);

      render(
        <PlanGate feature="export-pdf">
          <div>Export Content</div>
        </PlanGate>,
      );

      expect(screen.queryByText('Export Content')).not.toBeInTheDocument();
      expect(screen.getByText('PDF/Excel export')).toBeInTheDocument();
    });

    it('allows "export-pdf" when canExport returns true', () => {
      mockUsePlanLimits.mockReturnValue(allAllowed());

      render(
        <PlanGate feature="export-pdf">
          <div>Export Content</div>
        </PlanGate>,
      );

      expect(screen.getByText('Export Content')).toBeInTheDocument();
    });
  });
});

// ── Tests: UpgradePrompt ───────────────────────────────────────────────────────

describe('components/guards/UpgradePrompt', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders feature label and recommended plan', () => {
    render(<UpgradePrompt feature="scan" />);

    expect(screen.getByText('Scan limit reached')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Pro to unlock/)).toBeInTheDocument();
  });

  const knownFeatures = [
    { feature: 'scan', label: 'Scan limit reached', plan: 'Pro' },
    { feature: 'ai-fix', label: 'AI fix limit reached', plan: 'Pro' },
    { feature: 'pr', label: 'PR creation limit reached', plan: 'Pro' },
    { feature: 'schedules', label: 'Scheduled scans', plan: 'Pro' },
    { feature: 'custom-rules', label: 'Custom rules', plan: 'Team' },
    { feature: 'jira', label: 'JIRA integration', plan: 'Pro' },
    { feature: 'export-pdf', label: 'PDF/Excel export', plan: 'Pro' },
  ];

  knownFeatures.forEach(({ feature, label, plan }) => {
    it(`renders correct label and plan for "${feature}"`, () => {
      render(<UpgradePrompt feature={feature} />);

      expect(screen.getByText(label)).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`Upgrade to ${plan} to unlock`)),
      ).toBeInTheDocument();

      cleanup();
    });
  });

  it('renders default fallback for unknown feature', () => {
    render(<UpgradePrompt feature="unknown-feature" />);

    expect(screen.getByText('This feature')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Pro to unlock/)).toBeInTheDocument();
  });
});
