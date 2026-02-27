import type { LiquidityResult } from "./types";
import type { Timeframe } from "@/lib/marketData/types";

type LiquiheartApiResponse = {
  zones?: Array<{
    low: number;
    high: number;
    intensity?: number;
    label?: string;
  }>;
};

export async function fetchLiquiheartLiquidity(args: {
  symbol: string;
  timeframe: Timeframe;
  signal?: AbortSignal;
}): Promise<LiquidityResult> {
  const baseUrl = import.meta.env.VITE_LIQUIHEART_API_URL as string | undefined;
  const apiKey = import.meta.env.VITE_LIQUIHEART_API_KEY as string | undefined;

  if (!baseUrl) {
    return {
      zones: [],
      source: "none",
      warning: "Chưa cấu hình `VITE_LIQUIHEART_API_URL` nên chưa lấy được heatmap thanh khoản.",
    };
  }

  const url = new URL(baseUrl);
  url.searchParams.set("symbol", args.symbol);
  url.searchParams.set("timeframe", args.timeframe);

  const res = await fetch(url.toString(), {
    signal: args.signal,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });
  if (!res.ok) {
    return {
      zones: [],
      source: "liquiheart",
      warning: `Liquiheart HTTP ${res.status}`,
    };
  }

  const data: LiquiheartApiResponse = await res.json();
  const zones =
    data.zones?.filter((z) => Number.isFinite(z.low) && Number.isFinite(z.high)).map((z) => ({
      low: z.low,
      high: z.high,
      intensity: Number.isFinite(z.intensity) ? Math.max(0, Math.min(1, z.intensity!)) : 0.6,
      label: z.label,
    })) ?? [];

  return { zones, source: "liquiheart" };
}

