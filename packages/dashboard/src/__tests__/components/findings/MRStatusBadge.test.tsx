/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MRStatusBadge } from '../../../components/findings/MRStatusBadge';

describe('components/findings/MRStatusBadge', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders "MR Open" for opened status', () => {
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="opened"
      />,
    );

    expect(screen.getByText('MR Open')).toBeInTheDocument();
  });

  it('renders "MR Merged" with GitMerge icon for merged status', () => {
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="merged"
      />,
    );

    expect(screen.getByText('MR Merged')).toBeInTheDocument();
    // GitMerge icon from lucide-react renders as an SVG
    const link = screen.getByRole('link');
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders "MR Closed" for closed status', () => {
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="closed"
      />,
    );

    expect(screen.getByText('MR Closed')).toBeInTheDocument();
  });

  it('renders "Verified" with Check icon when verificationStatus=verified', () => {
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="merged"
        verificationStatus="verified"
      />,
    );

    expect(screen.getByText('Verified')).toBeInTheDocument();
    const link = screen.getByRole('link');
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders "Still Present" with X icon when verificationStatus=failed', () => {
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="merged"
        verificationStatus="failed"
      />,
    );

    expect(screen.getByText('Still Present')).toBeInTheDocument();
    const link = screen.getByRole('link');
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows "Verify Fix" button when status=merged and no verificationStatus', () => {
    const onVerify = vi.fn();
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="merged"
        onVerify={onVerify}
      />,
    );

    expect(screen.getByText('Verify Fix')).toBeInTheDocument();
  });

  it('does NOT show "Verify Fix" when status=opened', () => {
    const onVerify = vi.fn();
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="opened"
        onVerify={onVerify}
      />,
    );

    expect(screen.queryByText('Verify Fix')).not.toBeInTheDocument();
  });

  it('does NOT show "Verify Fix" when verificationStatus is set', () => {
    const onVerify = vi.fn();
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="merged"
        verificationStatus="verified"
        onVerify={onVerify}
      />,
    );

    expect(screen.queryByText('Verify Fix')).not.toBeInTheDocument();
  });

  it('calls onVerify when "Verify Fix" button is clicked', () => {
    const onVerify = vi.fn();
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="merged"
        onVerify={onVerify}
      />,
    );

    fireEvent.click(screen.getByText('Verify Fix'));
    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  it('shows "Verifying..." when isVerifying is true', () => {
    const onVerify = vi.fn();
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="merged"
        onVerify={onVerify}
        isVerifying={true}
      />,
    );

    expect(screen.getByText('Verifying...')).toBeInTheDocument();
    expect(screen.queryByText('Verify Fix')).not.toBeInTheDocument();
  });

  it('disables button when isVerifying is true', () => {
    const onVerify = vi.fn();
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="merged"
        onVerify={onVerify}
        isVerifying={true}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders link with correct href and target', () => {
    render(
      <MRStatusBadge
        mrUrl="https://gitlab.com/g/p/-/merge_requests/1"
        status="opened"
      />,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://gitlab.com/g/p/-/merge_requests/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
