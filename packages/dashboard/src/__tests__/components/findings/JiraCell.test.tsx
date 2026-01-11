// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { JiraCell } from "../../../components/findings/JiraCell";

describe("findings/JiraCell", () => {
  const defaultProps = {
    isLinking: false,
    linkInput: "",
    onLinkInputChange: vi.fn(),
    onStartLink: vi.fn(),
    onSaveLink: vi.fn(),
    onCancelLink: vi.fn(),
    onRemoveLink: vi.fn(),
  };

  it("renders link button when no issue key and not linking", () => {
    render(<JiraCell {...defaultProps} />);
    expect(screen.getByText(/Link/)).toBeInTheDocument();
  });

  it("calls onStartLink when link button is clicked", () => {
    const onStartLink = vi.fn();
    render(<JiraCell {...defaultProps} onStartLink={onStartLink} />);
    fireEvent.click(screen.getByText(/Link/));
    expect(onStartLink).toHaveBeenCalledTimes(1);
  });

  it("renders input when linking", () => {
    render(<JiraCell {...defaultProps} isLinking={true} />);
    const input = screen.getByPlaceholderText("PROJ-123");
    expect(input).toBeInTheDocument();
  });

  it("renders input with value", () => {
    render(<JiraCell {...defaultProps} isLinking={true} linkInput="TEST-456" />);
    const input = screen.getByPlaceholderText("PROJ-123");
    expect(input).toHaveValue("TEST-456");
  });

  it("calls onLinkInputChange when input changes", () => {
    const onLinkInputChange = vi.fn();
    render(<JiraCell {...defaultProps} isLinking={true} onLinkInputChange={onLinkInputChange} />);
    const input = screen.getByPlaceholderText("PROJ-123");
    fireEvent.change(input, { target: { value: "NEW-789" } });
    expect(onLinkInputChange).toHaveBeenCalledWith("NEW-789");
  });

  it("renders save button when linking", () => {
    render(<JiraCell {...defaultProps} isLinking={true} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("calls onSaveLink when save button is clicked", () => {
    const onSaveLink = vi.fn();
    render(<JiraCell {...defaultProps} isLinking={true} onSaveLink={onSaveLink} />);
    fireEvent.click(screen.getByText("✓"));
    expect(onSaveLink).toHaveBeenCalledTimes(1);
  });

  it("renders cancel button when linking", () => {
    render(<JiraCell {...defaultProps} isLinking={true} />);
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("calls onCancelLink when cancel button is clicked", () => {
    const onCancelLink = vi.fn();
    render(<JiraCell {...defaultProps} isLinking={true} onCancelLink={onCancelLink} />);
    const cancelButtons = screen.getAllByText("✕");
    fireEvent.click(cancelButtons[0]);
    expect(onCancelLink).toHaveBeenCalledTimes(1);
  });

  it("calls onSaveLink when Enter key is pressed", () => {
    const onSaveLink = vi.fn();
    render(<JiraCell {...defaultProps} isLinking={true} onSaveLink={onSaveLink} />);
    const input = screen.getByPlaceholderText("PROJ-123");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSaveLink).toHaveBeenCalledTimes(1);
  });

  it("calls onCancelLink when Escape key is pressed", () => {
    const onCancelLink = vi.fn();
    render(<JiraCell {...defaultProps} isLinking={true} onCancelLink={onCancelLink} />);
    const input = screen.getByPlaceholderText("PROJ-123");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancelLink).toHaveBeenCalledTimes(1);
  });

  it("renders issue key link when provided", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    expect(screen.getByText(/PROJ-123/)).toBeInTheDocument();
  });

  it("renders link with emoji when issue key exists", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    expect(screen.getByText("🔗 PROJ-123")).toBeInTheDocument();
  });

  it("renders remove button when issue key exists", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const removeButtons = screen.getAllByText("✕");
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onRemoveLink when remove button is clicked", () => {
    const onRemoveLink = vi.fn();
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" onRemoveLink={onRemoveLink} />);
    const removeButton = screen.getByText("✕");
    fireEvent.click(removeButton);
    expect(onRemoveLink).toHaveBeenCalledTimes(1);
  });

  it("applies correct styling to input when linking", () => {
    render(<JiraCell {...defaultProps} isLinking={true} />);
    const input = document.querySelector("input");
    expect(input).toHaveStyle({
      width: "80px",
      fontSize: "11px",
    });
  });

  it("applies correct styling to save button", () => {
    render(<JiraCell {...defaultProps} isLinking={true} />);
    const saveButton = screen.getByText("✓");
    expect(saveButton).toHaveStyle({
      background: "rgb(16, 185, 129)",
      color: "rgb(255, 255, 255)",
    });
  });

  it("applies correct styling to issue key link", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const link = screen.getByText("🔗 PROJ-123");
    expect(link).toHaveStyle({
      background: "rgb(219, 234, 254)",
      color: "rgb(29, 78, 216)",
    });
  });

  it("changes save button style on hover", () => {
    render(<JiraCell {...defaultProps} isLinking={true} />);
    const saveButton = screen.getByText("✓");

    fireEvent.mouseOver(saveButton);
    expect(saveButton).toHaveStyle({ background: "#059669" });

    fireEvent.mouseOut(saveButton);
    expect(saveButton).toHaveStyle({ background: "#10b981" });
  });

  it("changes cancel button style on hover", () => {
    render(<JiraCell {...defaultProps} isLinking={true} />);
    const cancelButton = screen.getAllByText("✕")[0];

    fireEvent.mouseOver(cancelButton);
    expect(cancelButton).toHaveStyle({ background: "#e2e8f0" });

    fireEvent.mouseOut(cancelButton);
    expect(cancelButton).toHaveStyle({ background: "#f1f5f9" });
  });

  it("prevents default action on issue key link click", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const link = screen.getByText("🔗 PROJ-123");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "preventDefault", {
      value: vi.fn(),
      writable: false,
    });
    link.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("changes issue key link style on hover", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const link = screen.getByText("🔗 PROJ-123");

    fireEvent.mouseOver(link);
    expect(link).toHaveStyle({ background: "#bfdbfe" });
    expect(link.style.borderColor).toBe("rgb(147, 197, 253)");

    fireEvent.mouseOut(link);
    expect(link).toHaveStyle({ background: "#dbeafe" });
    expect(link.style.borderColor).toBe("transparent");
  });

  it("changes remove button style on hover", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const removeButton = screen.getByText("✕");

    fireEvent.mouseOver(removeButton);
    expect(removeButton).toHaveStyle({ color: "#ef4444", background: "#fef2f2" });

    fireEvent.mouseOut(removeButton);
    expect(removeButton).toHaveStyle({ color: "#94a3b8", background: "none" });
  });

  it("changes link button style on hover", () => {
    render(<JiraCell {...defaultProps} />);
    const linkButton = screen.getByText(/Link/);

    fireEvent.mouseEnter(linkButton);
    expect(linkButton).toHaveStyle({ background: "#f1f5f9" });

    fireEvent.mouseLeave(linkButton);
    expect(linkButton).toHaveStyle({ background: "#f8fafc" });
  });
});
