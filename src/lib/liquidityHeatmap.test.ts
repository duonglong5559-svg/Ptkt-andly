import { describe, expect, it } from "vitest";
import { fetchLiquidityHeatmap } from "./liquidityHeatmap";

describe("fetchLiquidityHeatmap", () => {
  it("uses fallback liquidity data when API endpoint is not configured", async () => {
    const data = await fetchLiquidityHeatmap("XAUUSD", 2348.42);

    expect(data.symbol).toBe("XAUUSD");
    expect(data.source).toContain("fallback");
    expect(data.hotspots.length).toBeGreaterThan(0);
    expect(data.totalBidLiquidity).toBeGreaterThan(0);
    expect(data.totalAskLiquidity).toBeGreaterThan(0);
  });
});
