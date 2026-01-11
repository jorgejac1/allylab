// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import * as exports from "../../../components/benchmarking";

describe("benchmarking/index", () => {
  it("exports CompetitorBenchmark", () => {
    expect(exports.CompetitorBenchmark).toBeDefined();
    expect(typeof exports.CompetitorBenchmark).toBe("function");
  });
});
