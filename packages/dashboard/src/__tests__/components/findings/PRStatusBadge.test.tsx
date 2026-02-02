// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PRStatusBadge } from "../../../components/findings/PRStatusBadge";
import type { PRTrackingInfo } from "../../../types/github";

describe("findings/PRStatusBadge", () => {
  const basePR: PRTrackingInfo = {
    id: "pr1",
    prNumber: 123,
    prUrl: "https://github.com/test/repo/pull/123",
    status: "open",
    createdAt: "2024-01-01T00:00:00Z",
    findingIds: ["f1"],
    owner: "test",
    repo: "repo",
    branchName: "fix/test",
    scanUrl: "https://test.com",
  };

  it("renders open PR badge", () => {
    render(<PRStatusBadge pr={basePR} />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("PR #123 • Open");
    expect(link).toHaveAttribute("href", basePR.prUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders merged PR badge", () => {
    const mergedPR = { ...basePR, status: "merged" as const };
    const { container } = render(<PRStatusBadge pr={mergedPR} />);

    expect(screen.getByText(/Merged/)).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders closed PR badge", () => {
    const closedPR = { ...basePR, status: "closed" as const };
    render(<PRStatusBadge pr={closedPR} />);

    expect(screen.getByText(/Closed/)).toBeInTheDocument();
  });

  it("renders verified PR badge", () => {
    const verifiedPR = { ...basePR, verificationStatus: "verified" as const };
    const { container } = render(<PRStatusBadge pr={verifiedPR} />);

    expect(screen.getByText(/Verified/)).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders failed verification badge", () => {
    const failedPR = { ...basePR, verificationStatus: "failed" as const };
    const { container } = render(<PRStatusBadge pr={failedPR} />);

    expect(screen.getByText(/Still Present/)).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows verify button for merged PR without verification", () => {
    const mergedPR = { ...basePR, status: "merged" as const };
    const onVerify = vi.fn();

    render(<PRStatusBadge pr={mergedPR} onVerify={onVerify} />);

    const verifyButton = screen.getByText("Verify Fix");
    expect(verifyButton).toBeInTheDocument();

    fireEvent.click(verifyButton);
    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  it("does not show verify button for open PR", () => {
    render(<PRStatusBadge pr={basePR} onVerify={vi.fn()} />);

    expect(screen.queryByText("Verify Fix")).not.toBeInTheDocument();
  });

  it("does not show verify button for already verified PR", () => {
    const verifiedPR = { ...basePR, status: "merged" as const, verificationStatus: "verified" as const };
    render(<PRStatusBadge pr={verifiedPR} onVerify={vi.fn()} />);

    expect(screen.queryByText("Verify Fix")).not.toBeInTheDocument();
  });

  it("does not show verify button when onVerify not provided", () => {
    const mergedPR = { ...basePR, status: "merged" as const };
    render(<PRStatusBadge pr={mergedPR} />);

    expect(screen.queryByText("Verify Fix")).not.toBeInTheDocument();
  });

  it("shows verifying state", () => {
    const mergedPR = { ...basePR, status: "merged" as const };
    render(<PRStatusBadge pr={mergedPR} onVerify={vi.fn()} isVerifying={true} />);

    const verifyButton = screen.getByText("Verifying...");
    expect(verifyButton).toBeDisabled();
    expect(verifyButton).toHaveStyle({ cursor: "wait", opacity: 0.7 });
  });

  it("applies correct styling for verified status", () => {
    const verifiedPR = { ...basePR, verificationStatus: "verified" as const };
    const { container } = render(<PRStatusBadge pr={verifiedPR} />);

    const link = container.querySelector("a");
    expect(link).toHaveStyle({
      background: "rgb(220, 252, 231)",
      color: "rgb(22, 163, 74)",
    });
  });

  it("applies correct styling for failed verification", () => {
    const failedPR = { ...basePR, verificationStatus: "failed" as const };
    const { container } = render(<PRStatusBadge pr={failedPR} />);

    const link = container.querySelector("a");
    expect(link).toHaveStyle({
      background: "rgb(254, 242, 242)",
      color: "rgb(220, 38, 38)",
    });
  });

  it("applies correct styling for merged status", () => {
    const mergedPR = { ...basePR, status: "merged" as const };
    const { container } = render(<PRStatusBadge pr={mergedPR} />);

    const link = container.querySelector("a");
    expect(link).toHaveStyle({
      background: "rgb(243, 232, 255)",
      color: "rgb(147, 51, 234)",
    });
  });

  it("applies correct styling for closed status", () => {
    const closedPR = { ...basePR, status: "closed" as const };
    const { container } = render(<PRStatusBadge pr={closedPR} />);

    const link = container.querySelector("a");
    expect(link).toHaveStyle({
      background: "rgb(241, 245, 249)",
      color: "rgb(100, 116, 139)",
    });
  });

  it("applies correct styling for open status", () => {
    const { container } = render(<PRStatusBadge pr={basePR} />);

    const link = container.querySelector("a");
    expect(link).toHaveStyle({
      background: "rgb(239, 246, 255)",
      color: "rgb(37, 99, 235)",
    });
  });
});
