import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebhookManager } from "../../../components/settings/WebhookManager";
import type { Webhook } from "../../../types/webhook";

const hookReturn = {
  webhooks: [] as Webhook[],
  createWebhook: vi.fn().mockResolvedValue(true),
  updateWebhook: vi.fn().mockResolvedValue(true),
  deleteWebhook: vi.fn().mockResolvedValue(true),
  testWebhook: vi.fn().mockResolvedValue({ success: true }),
};

vi.mock("../../../hooks/useWebhooks", () => ({
  useWebhooks: () => hookReturn,
}));

const baseWebhook: Webhook = {
  id: "1",
  name: "Alerts",
  url: "https://hooks.slack.com/services/123",
  type: "slack",
  events: ["scan.completed"],
  enabled: true,
  lastStatus: "success",
  lastTriggered: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe("settings/WebhookManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookReturn.webhooks = [baseWebhook];
    hookReturn.testWebhook = vi.fn().mockResolvedValue({ success: true });
  });

  it("renders empty state and prevents add when invalid", () => {
    hookReturn.webhooks = [];
    render(<WebhookManager />);
    expect(screen.getByText(/No notifications configured/)).toBeInTheDocument();
    const addBtn = screen.getByRole("button", { name: /Add Slack Notification/ });
    fireEvent.click(addBtn);
    expect(hookReturn.createWebhook).not.toHaveBeenCalled();
  });

  it("returns early when required fields are missing", () => {
    render(<WebhookManager />);
    // Deselect the default event so selectedEvents becomes empty
    fireEvent.click(screen.getAllByText("Scan Completed")[0]);
    const addBtn = screen.getAllByRole("button", { name: /Add Slack Notification/ })[0];
    (addBtn as HTMLButtonElement).disabled = false;
    fireEvent.click(addBtn); // should hit guard and return
    expect(hookReturn.createWebhook).not.toHaveBeenCalled();
  });

  it("returns early when events are empty even with name and url", async () => {
    const user = userEvent.setup();
    hookReturn.createWebhook.mockClear();
    render(<WebhookManager />);

    const addCard = screen.getAllByText("Add Notification")[0].parentElement as HTMLElement;

    await user.type(within(addCard).getAllByPlaceholderText("Notification name (e.g., #a11y-alerts)")[0], "Hook");
    await user.type(within(addCard).getAllByPlaceholderText("https://hooks.slack.com/services/...")[0], "https://hooks.slack.com/services/x");

    const addBtn = within(addCard).getAllByRole("button", { name: /Add Slack Notification/ })[0] as HTMLButtonElement;
    // Button should be enabled with default event selected
    expect(addBtn).not.toBeDisabled();

    // Deselect the default "Scan Completed" event to make selectedEvents empty
    await user.click(within(addCard).getByText("Scan Completed"));

    // Button should now be disabled when events are empty
    expect(addBtn).toBeDisabled();

    // Get the onClick handler from React's internal props
    const reactPropsKey = Object.keys(addBtn).find(key => key.startsWith('__reactProps$'));
    if (reactPropsKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reactProps = (addBtn as any)[reactPropsKey];
      if (reactProps?.onClick) {
        // Directly call the onClick handler to test the guard clause
        await reactProps.onClick();
      }
    }

    // Verify the guard clause prevented the call
    expect(hookReturn.createWebhook).not.toHaveBeenCalled();
  });

  it("returns early when name is empty after being filled", async () => {
    const user = userEvent.setup();
    hookReturn.createWebhook.mockClear();
    render(<WebhookManager />);

    const addCard = screen.getAllByText("Add Notification")[0].parentElement as HTMLElement;
    const nameInput = within(addCard).getAllByPlaceholderText("Notification name (e.g., #a11y-alerts)")[0];
    const urlInput = within(addCard).getAllByPlaceholderText("https://hooks.slack.com/services/...")[0];

    // Fill both fields so button becomes enabled
    await user.type(nameInput, "Test");
    await user.type(urlInput, "https://hooks.slack.com/services/test");

    const addBtn = within(addCard).getAllByRole("button", { name: /Add Slack Notification/ })[0] as HTMLButtonElement;
    expect(addBtn).not.toBeDisabled();

    // Now clear the name field - button will become disabled
    await user.clear(nameInput);
    expect(addBtn).toBeDisabled();

    // Get the onClick handler from React's internal props
    const reactPropsKey = Object.keys(addBtn).find(key => key.startsWith('__reactProps$'));
    if (reactPropsKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reactProps = (addBtn as any)[reactPropsKey];
      if (reactProps?.onClick) {
        // Directly call the onClick handler to test the guard clause
        await reactProps.onClick();
      }
    }

    // Verify the guard clause prevented the call
    expect(hookReturn.createWebhook).not.toHaveBeenCalled();
  });

  it("returns early when url is empty after being filled", async () => {
    const user = userEvent.setup();
    hookReturn.createWebhook.mockClear();
    render(<WebhookManager />);

    const addCard = screen.getAllByText("Add Notification")[0].parentElement as HTMLElement;
    const nameInput = within(addCard).getAllByPlaceholderText("Notification name (e.g., #a11y-alerts)")[0];
    const urlInput = within(addCard).getAllByPlaceholderText("https://hooks.slack.com/services/...")[0];

    // Fill both fields so button becomes enabled
    await user.type(nameInput, "Test Hook");
    await user.type(urlInput, "https://test.com");

    const addBtn = within(addCard).getAllByRole("button", { name: /Add Slack Notification/ })[0] as HTMLButtonElement;
    expect(addBtn).not.toBeDisabled();

    // Now clear the URL field - button will become disabled
    await user.clear(urlInput);
    expect(addBtn).toBeDisabled();

    // Get the onClick handler from React's internal props
    const reactPropsKey = Object.keys(addBtn).find(key => key.startsWith('__reactProps$'));
    if (reactPropsKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reactProps = (addBtn as any)[reactPropsKey];
      if (reactProps?.onClick) {
        // Directly call the onClick handler to test the guard clause
        await reactProps.onClick();
      }
    }

    // Verify the guard clause prevented the call
    expect(hookReturn.createWebhook).not.toHaveBeenCalled();
  });

  it("returns early when name and url are only whitespace", async () => {
    const user = userEvent.setup();
    hookReturn.createWebhook.mockClear();
    render(<WebhookManager />);

    const addCard = screen.getAllByText("Add Notification")[0].parentElement as HTMLElement;
    const nameInput = within(addCard).getAllByPlaceholderText("Notification name (e.g., #a11y-alerts)")[0];
    const urlInput = within(addCard).getAllByPlaceholderText("https://hooks.slack.com/services/...")[0];

    // Fill with valid data first
    await user.type(nameInput, "Test");
    await user.type(urlInput, "https://test.com");

    const addBtn = within(addCard).getAllByRole("button", { name: /Add Slack Notification/ })[0] as HTMLButtonElement;
    expect(addBtn).not.toBeDisabled();

    // Clear and fill with whitespace only - this tests the .trim() logic
    await user.clear(nameInput);
    await user.type(nameInput, "   ");
    await user.clear(urlInput);
    await user.type(urlInput, "  ");

    // Button should now be disabled
    expect(addBtn).toBeDisabled();

    // Get the onClick handler from React's internal props
    const reactPropsKey = Object.keys(addBtn).find(key => key.startsWith('__reactProps$'));
    if (reactPropsKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reactProps = (addBtn as any)[reactPropsKey];
      if (reactProps?.onClick) {
        // Directly call the onClick handler to test the guard clause
        await reactProps.onClick();
      }
    }

    // Verify the guard clause with .trim() prevented the call
    expect(hookReturn.createWebhook).not.toHaveBeenCalled();
  });

  it("calls createWebhook with undefined secret when empty", async () => {
    render(<WebhookManager />);

    fireEvent.change(screen.getAllByPlaceholderText("Notification name (e.g., #a11y-alerts)")[0], {
      target: { value: "Slack Hook" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("https://hooks.slack.com/services/...")[0], {
      target: { value: "https://hooks.slack.com/services/abc" },
    });
    fireEvent.click(screen.getAllByText("Score Dropped")[0]);

    const addSlack = screen.getAllByRole("button", { name: /Add Slack Notification/ })[0] as HTMLButtonElement;
    expect(addSlack).not.toBeDisabled();
    fireEvent.click(addSlack);
    await waitFor(() => expect(hookReturn.createWebhook).toHaveBeenCalled());
    const [nameArg, urlArg, eventsArg, secretArg, platformArg] = hookReturn.createWebhook.mock.calls[0];
    expect(nameArg).toBe("Slack Hook");
    expect(urlArg).toBe("https://hooks.slack.com/services/abc");
    expect(Array.isArray(eventsArg)).toBe(true);
    expect(secretArg).toBeUndefined();
    expect(platformArg).toBe("slack");
  });

  it("adds webhook, toggles events/platform, tests, toggles and deletes", async () => {
    render(<WebhookManager />);

    // Change platform to generic and ensure secret input appears
    fireEvent.click(screen.getAllByText("Generic Webhook")[0]);
    expect(screen.getByPlaceholderText(/HMAC signature/)).toBeInTheDocument();

    fireEvent.change(screen.getAllByPlaceholderText("Notification name (e.g., #a11y-alerts)")[0], {
      target: { value: "My Hook" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("https://your-server.com/webhook")[0], {
      target: { value: "https://webhook.test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/HMAC signature/), { target: { value: "secret" } });

    // Toggle additional event
    fireEvent.click(screen.getAllByText("Scan Failed")[0]);

    const addGeneric = screen.getByRole("button", { name: /Add Generic Webhook Notification/ }) as HTMLButtonElement;
    addGeneric.disabled = false;
    fireEvent.click(addGeneric);
    await waitFor(() =>
      expect(hookReturn.createWebhook).toHaveBeenCalledWith(
        "My Hook",
        "https://webhook.test",
        expect.arrayContaining(["scan.failed"]),
        "secret",
        "generic"
      )
    );

    // Existing webhook interactions
    const listHeading = screen.getAllByText(/Notifications/)[0];
    const listCard = listHeading.closest("div") as HTMLElement;
    fireEvent.click(within(listCard).getAllByRole("button", { name: "Test" })[0]);
    await waitFor(() => expect(hookReturn.testWebhook).toHaveBeenCalledWith("1"));

    // Find delete button (ghost button with red color for Trash icon)
    const allButtons = within(listCard).getAllByRole("button");
    const deleteButton = allButtons.find(btn => btn.style.color === 'rgb(220, 38, 38)' || btn.style.color === '#dc2626');
    fireEvent.click(deleteButton!);
    await waitFor(() => expect(hookReturn.deleteWebhook).toHaveBeenCalledWith("1"));

    fireEvent.click(within(listCard).getAllByRole("button", { name: "Test" })[0]);
    await waitFor(() => expect(screen.getByText(/Test passed/i)).toBeInTheDocument());

    // Toggle enabled via first toggle button in list
    const toggle = document.querySelector('button[style*="width: 40px"]') as HTMLButtonElement;
    fireEvent.click(toggle);
    await waitFor(() => expect(hookReturn.updateWebhook).toHaveBeenCalledWith("1", { enabled: false }));
  });

  it("shows test failure result", async () => {
    hookReturn.testWebhook = vi.fn().mockResolvedValue({ success: false, error: "bad" });
    hookReturn.webhooks = [baseWebhook];
    render(<WebhookManager />);

    const testButtons = screen.getAllByRole("button", { name: "Test" });
    for (const btn of testButtons) {
      fireEvent.click(btn);
    }
    await waitFor(() => expect(hookReturn.testWebhook).toHaveBeenCalledWith("1"));
    await waitFor(() => expect(screen.getByText("bad")).toBeInTheDocument());
  });

  it("renders generic/teams styling, truncation, and failure states", async () => {
    const longUrl = "https://example.com/" + "very-long-path-".repeat(6);
    hookReturn.webhooks = [
      {
        ...baseWebhook,
        id: "g1",
        type: "generic",
        enabled: false,
        lastStatus: "failed",
        url: longUrl,
        events: ["scan.failed"],
      },
      {
        ...baseWebhook,
        id: "t1",
        type: "teams",
        name: "Teams Alert",
        lastStatus: "success",
      },
      {
        ...baseWebhook,
        id: "u1",
        name: "Unknown",
        type: "unknown" as unknown as Webhook["type"],
        lastStatus: "failed",
      },
    ];
    hookReturn.testWebhook = vi.fn().mockResolvedValue({ success: false });

    render(<WebhookManager />);

    const failedStatusNode = screen.getAllByText("Failed")[0] as HTMLElement;
    let genericCard: HTMLElement | null = failedStatusNode;
    while (genericCard && !genericCard.style.border) {
      genericCard = genericCard.parentElement;
    }
    expect(genericCard).not.toBeNull();
    const card = genericCard as HTMLElement;
    expect(card).toHaveStyle({ background: "#f8fafc", opacity: "0.7" });
    const toggleBtn = card.querySelector("button") as HTMLButtonElement;
    expect(toggleBtn).toHaveStyle({ background: "#cbd5e1" });
    expect(card.textContent).toContain("Generic");

    const failedStatus = within(card).getByText("Failed");
    expect(failedStatus).toHaveStyle({ background: "#fef2f2", color: "#dc2626" });

    const teamsNode = screen.getByText("Teams Alert") as HTMLElement;
    let teamsCard: HTMLElement | null = teamsNode;
    while (teamsCard && !teamsCard.style.border) {
      teamsCard = teamsCard.parentElement;
    }
    expect(teamsCard).not.toBeNull();
    expect(within(teamsCard as HTMLElement).getByText("Microsoft Teams")).toHaveStyle({ background: "#464EB8" });

    // Test failure result without error message defaults to "Test failed"
    fireEvent.click(card.querySelectorAll("button")[card.querySelectorAll("button").length - 2]);
    await waitFor(() => expect(hookReturn.testWebhook).toHaveBeenCalledWith("g1"));
    await waitFor(() => expect(screen.getByText("Test failed")).toBeInTheDocument());

    // Truncated URL renders ellipsis
    expect(
      within(card).getByText((content) => content.startsWith("https://example.com/") && content.endsWith("..."))
    ).toBeInTheDocument();

    const unknownSpan = screen.getAllByText("Unknown")[0];
    let unknownCard = unknownSpan.parentElement as HTMLElement | null;
    while (unknownCard && !unknownCard.style.border) {
      unknownCard = unknownCard.parentElement as HTMLElement | null;
    }
    expect(unknownCard).not.toBeNull();
    expect((unknownCard as HTMLElement).textContent).toContain("Generic");
  });
});
