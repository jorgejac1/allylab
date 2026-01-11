// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterButton, PillButton, Divider } from "../../../components/findings/FilterButton";

describe("findings/FilterButton", () => {
  describe("FilterButton", () => {
    it("renders button with label", () => {
      render(<FilterButton active={false} onClick={vi.fn()} label="Test" />);

      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("calls onClick when clicked", () => {
      const onClick = vi.fn();
      render(<FilterButton active={false} onClick={onClick} label="Test" />);

      fireEvent.click(screen.getByText("Test"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("applies active styling when active", () => {
      const { container } = render(<FilterButton active={true} onClick={vi.fn()} label="Test" />);

      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        background: "#fff",
        color: "#0f172a",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      });
    });

    it("applies inactive styling when not active", () => {
      const { container } = render(<FilterButton active={false} onClick={vi.fn()} label="Test" />);

      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        background: "transparent",
        color: "#64748b",
        boxShadow: "none",
      });
    });
  });

  describe("PillButton", () => {
    it("renders button with label", () => {
      render(<PillButton active={false} onClick={vi.fn()} label="Pill" />);

      expect(screen.getByText("Pill")).toBeInTheDocument();
    });

    it("calls onClick when clicked", () => {
      const onClick = vi.fn();
      render(<PillButton active={false} onClick={onClick} label="Pill" />);

      fireEvent.click(screen.getByText("Pill"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("applies active styling with default color", () => {
      const { container } = render(<PillButton active={true} onClick={vi.fn()} label="Pill" />);

      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        background: "rgb(37, 99, 235)",
        color: "rgb(255, 255, 255)",
      });
    });

    it("applies active styling with custom color", () => {
      const { container } = render(
        <PillButton active={true} activeColor="#ff0000" onClick={vi.fn()} label="Pill" />
      );

      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        background: "rgb(255, 0, 0)",
        color: "rgb(255, 255, 255)",
      });
    });

    it("applies inactive styling", () => {
      const { container } = render(<PillButton active={false} onClick={vi.fn()} label="Pill" />);

      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        background: "rgb(255, 255, 255)",
        color: "rgb(100, 116, 139)",
      });
    });

    it("applies pill border radius", () => {
      const { container } = render(<PillButton active={false} onClick={vi.fn()} label="Pill" />);

      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        borderRadius: "20px",
        padding: "4px 12px",
      });
    });
  });

  describe("Divider", () => {
    it("renders divider element", () => {
      const { container } = render(<Divider />);

      const divider = container.firstChild as HTMLElement;
      expect(divider).toBeInTheDocument();
      expect(divider).toHaveStyle({
        width: "1px",
        height: "20px",
        background: "#e2e8f0",
        margin: "0 4px",
      });
    });
  });
});
