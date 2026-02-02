import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SettingRow } from "../../../components/ui/SettingRow";

describe("ui/SettingRow", () => {
  it("renders label and children", () => {
    render(
      <SettingRow label="Theme">
        <select>
          <option>Dark</option>
        </select>
      </SettingRow>
    );
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders optional description", () => {
    render(
      <SettingRow label="Notifications" description="Enable email alerts">
        <input type="checkbox" />
      </SettingRow>
    );
    expect(screen.getByText("Enable email alerts")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(
      <SettingRow label="Language">
        <span>English</span>
      </SettingRow>
    );
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });
});
