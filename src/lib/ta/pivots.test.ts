import { describe, expect, it } from "vitest";
import { pivotPointsClassic } from "./pivots";

describe("pivotPointsClassic", () => {
  it("computes classic pivots correctly", () => {
    const p = pivotPointsClassic(110, 100, 105);
    expect(p.pp).toBeCloseTo(105, 10);
    expect(p.r1).toBeCloseTo(110, 10);
    expect(p.s1).toBeCloseTo(100, 10);
    expect(p.r2).toBeCloseTo(115, 10);
    expect(p.s2).toBeCloseTo(95, 10);
    expect(p.r3).toBeCloseTo(120, 10);
    expect(p.s3).toBeCloseTo(90, 10);
  });
});

