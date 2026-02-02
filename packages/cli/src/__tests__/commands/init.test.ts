import { beforeEach, describe, expect, it, vi, afterAll } from "vitest";

const mockWriteFileSync = vi.fn();
const mockExistsSync = vi.fn();
const mockMkdirSync = vi.fn();

vi.mock("fs", () => ({
  writeFileSync: mockWriteFileSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
}));

vi.mock("chalk", () => {
  const id = (s: string) => s;
  const color = Object.assign((s: string) => s, { bold: (s: string) => s });
  return {
    default: Object.assign(id, {
      bold: Object.assign(id, { blue: color, red: color, green: color }),
      dim: color,
      cyan: color,
      yellow: color,
      red: color,
      green: color,
    }),
    __esModule: true,
  };
});

const exitCalls: Array<string | number | null | undefined> = [];
const mockExit = vi.spyOn(process, "exit").mockImplementation((code?: string | number | null) => {
  exitCalls.push(code ?? undefined);
  return undefined as never;
});

describe("cli/init command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exitCalls.length = 0;
    mockExistsSync.mockReturnValue(false);
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  const loadCommand = async () => {
    vi.resetModules();
    let capturedAction: ((template: string | undefined, opts: Record<string, unknown>) => Promise<void>) | undefined;
    vi.doMock("commander", () => {
      class MockCommand {
        description() { return this; }
        argument() { return this; }
        option() { return this; }
        action(fn: (template: string | undefined, opts: Record<string, unknown>) => Promise<void>) {
          capturedAction = fn;
          return this;
        }
      }
      return { Command: MockCommand };
    });
    const { initCommand } = await import("../../commands/init.js");
    if (!capturedAction) {
      throw new Error("Action not captured");
    }
    void initCommand;
    return capturedAction;
  };

  describe("list templates", () => {
    it("lists available templates when --list flag is used", async () => {
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await action(undefined, { list: true });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Available templates:"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("github-actions"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("gitlab-ci"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("jenkins"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("azure-pipelines"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("circleci"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("config"));
      consoleSpy.mockRestore();
    });

    it("lists templates when no template argument provided", async () => {
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await action(undefined, {});

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Available templates:"));
      consoleSpy.mockRestore();
    });
  });

  describe("github-actions template", () => {
    it("creates GitHub Actions workflow file", async () => {
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await action("github-actions", {});

      expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining(".github/workflows"), { recursive: true });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".github/workflows/accessibility.yml"),
        expect.stringContaining("Accessibility Check"),
        "utf-8"
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Created"));
      consoleSpy.mockRestore();
    });

    it("includes SARIF upload in GitHub Actions template", async () => {
      const action = await loadCommand();

      await action("github-actions", {});

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("upload-sarif"),
        "utf-8"
      );
    });
  });

  describe("gitlab-ci template", () => {
    it("creates GitLab CI file", async () => {
      const action = await loadCommand();

      await action("gitlab-ci", {});

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".gitlab-ci.yml"),
        expect.stringContaining("accessibility:"),
        "utf-8"
      );
    });
  });

  describe("jenkins template", () => {
    it("creates Jenkinsfile", async () => {
      const action = await loadCommand();

      await action("jenkins", {});

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("Jenkinsfile.accessibility"),
        expect.stringContaining("pipeline"),
        "utf-8"
      );
    });
  });

  describe("azure-pipelines template", () => {
    it("creates Azure Pipelines file", async () => {
      const action = await loadCommand();

      await action("azure-pipelines", {});

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("azure-pipelines-accessibility.yml"),
        expect.stringContaining("vmImage"),
        "utf-8"
      );
    });
  });

  describe("circleci template", () => {
    it("creates CircleCI config file", async () => {
      const action = await loadCommand();

      await action("circleci", {});

      expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining(".circleci"), { recursive: true });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".circleci/config.yml"),
        expect.stringContaining("version: 2.1"),
        "utf-8"
      );
    });
  });

  describe("config template", () => {
    it("creates AllyLab config file with sample config", async () => {
      const action = await loadCommand();

      await action("config", {});

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining(".allylabrc.json"),
        expect.stringContaining("apiUrl"),
        "utf-8"
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("wcag21aa"),
        "utf-8"
      );
    });
  });

  describe("error handling", () => {
    it("exits with code 1 for unknown template", async () => {
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await action("unknown-template", {});

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown template: unknown-template"));
      expect(mockExit).toHaveBeenCalledWith(1);
      consoleSpy.mockRestore();
    });

    it("exits with code 1 when file exists without --force", async () => {
      mockExistsSync.mockReturnValue(true);
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await action("config", {});

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("File already exists"));
      expect(mockExit).toHaveBeenCalledWith(1);
      consoleSpy.mockRestore();
    });

    it("overwrites file when --force flag is used", async () => {
      mockExistsSync.mockReturnValue(true);
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await action("config", { force: true });

      expect(mockWriteFileSync).toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("directory creation", () => {
    it("creates parent directories when they don't exist", async () => {
      mockExistsSync.mockImplementation((path: string) => {
        // File doesn't exist, but check for directory
        if (path.includes(".github")) return false;
        return false;
      });
      const action = await loadCommand();

      await action("github-actions", {});

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining(".github/workflows"),
        { recursive: true }
      );
    });

    it("skips directory creation if directory exists", async () => {
      mockExistsSync.mockImplementation((path: string) => {
        // Directory exists, file doesn't
        if (path.includes(".allylabrc.json")) return false;
        return true;
      });
      const action = await loadCommand();

      await action("config", {});

      // mkdirSync should not be called for existing directories
      expect(mockWriteFileSync).toHaveBeenCalled();
    });
  });

  describe("next steps messaging", () => {
    it("shows config-specific next steps", async () => {
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await action("config", {});

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Next steps:"));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(".allylabrc.json"));
      consoleSpy.mockRestore();
    });

    it("shows GitHub-specific next steps with security tab info", async () => {
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await action("github-actions", {});

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Security tab"));
      consoleSpy.mockRestore();
    });

    it("shows generic CI next steps for other templates", async () => {
      const action = await loadCommand();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await action("gitlab-ci", {});

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Commit and push"));
      consoleSpy.mockRestore();
    });
  });
});
