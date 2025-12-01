import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";

const writeFileSyncMock = vi.fn();

vi.mock("fs", () => ({ writeFileSync: writeFileSyncMock }));

describe("utils/file", () => {
  const cwdSpy = vi.spyOn(process, "cwd");

  beforeEach(() => {
    writeFileSyncMock.mockClear();
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  it("writes content to resolved path from cwd", async () => {
    cwdSpy.mockReturnValue("/tmp/project");
    const { writeOutput } = await import("../../utils/file.js");

    writeOutput("out.txt", "hello");

    expect(writeFileSyncMock).toHaveBeenCalledWith("/tmp/project/out.txt", "hello", "utf-8");
  });
});
