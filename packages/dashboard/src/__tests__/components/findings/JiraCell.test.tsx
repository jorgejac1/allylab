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
    const { container } = render(<JiraCell {...defaultProps} isLinking={true} />);
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(buttons[0].querySelector("svg")).toBeInTheDocument(); // Check icon (save button)
  });

  it("calls onSaveLink when save button is clicked", () => {
    const onSaveLink = vi.fn();
    const { container } = render(<JiraCell {...defaultProps} isLinking={true} onSaveLink={onSaveLink} />);
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[0]); // First button is save
    expect(onSaveLink).toHaveBeenCalledTimes(1);
  });

  it("renders cancel button when linking", () => {
    const { container } = render(<JiraCell {...defaultProps} isLinking={true} />);
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(buttons[1].querySelector("svg")).toBeInTheDocument(); // Check icon (cancel button)
  });

  it("calls onCancelLink when cancel button is clicked", () => {
    const onCancelLink = vi.fn();
    const { container } = render(<JiraCell {...defaultProps} isLinking={true} onCancelLink={onCancelLink} />);
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[1]); // Second button is cancel
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

  it("renders link when issue key exists", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    expect(screen.getByText(/PROJ-123/)).toBeInTheDocument();
  });

  it("renders remove button when issue key exists", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("calls onRemoveLink when remove button is clicked", () => {
    const onRemoveLink = vi.fn();
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" onRemoveLink={onRemoveLink} />);
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemoveLink).toHaveBeenCalledTimes(1);
  });

  it("applies correct styling to input when linking", () => {
    render(<JiraCell {...defaultProps} isLinking={true} />);
    const input = document.querySelector("input");
    expect(input).toHaveClass("w-20", "text-xs");
  });

  it("applies correct styling to save button", () => {
    const { container } = render(<JiraCell {...defaultProps} isLinking={true} />);
    const saveButton = container.querySelectorAll("button")[0];
    expect(saveButton).toHaveClass("bg-emerald-500", "text-white");
  });

  it("applies correct styling to issue key link", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const link = screen.getByText(/PROJ-123/).closest("a");
    expect(link).toHaveClass("bg-blue-100", "text-blue-700");
  });

  it("has hover classes on save button", () => {
    const { container } = render(<JiraCell {...defaultProps} isLinking={true} />);
    const saveButton = container.querySelectorAll("button")[0];
    expect(saveButton).toHaveClass("hover:bg-emerald-600");
  });

  it("has hover classes on cancel button", () => {
    const { container } = render(<JiraCell {...defaultProps} isLinking={true} />);
    const cancelButton = container.querySelectorAll("button")[1];
    expect(cancelButton).toHaveClass("bg-slate-100", "hover:bg-slate-200");
  });

  it("prevents default action on issue key link click", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const link = screen.getByText(/PROJ-123/).closest("a")!;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "preventDefault", {
      value: vi.fn(),
      writable: false,
    });
    link.dispatchEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("has hover classes on issue key link", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const link = screen.getByText(/PROJ-123/).closest("a");
    expect(link).toHaveClass("hover:bg-blue-200", "hover:border-blue-300");
  });

  it("has hover classes on remove button", () => {
    render(<JiraCell {...defaultProps} issueKey="PROJ-123" />);
    const removeButton = screen.getByRole("button", { name: /remove/i });
    expect(removeButton).toHaveClass("text-slate-400", "hover:text-red-500", "hover:bg-red-50");
  });

  it("has hover classes on link button", () => {
    render(<JiraCell {...defaultProps} />);
    const linkButton = screen.getByText(/Link/).closest("button");
    expect(linkButton).toHaveClass("bg-slate-50", "hover:bg-slate-100");
  });
});
