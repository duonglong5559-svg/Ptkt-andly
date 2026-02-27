export interface LiquidityHotspot {
  price: number;
  side: "bid" | "ask";
  intensity: number;
  liquidity: number;
  note: string;
}

export interface LiquidityHeatmapData {
  symbol: string;
  source: string;
  updatedAt: string;
  totalBidLiquidity: number;
  totalAskLiquidity: number;
  imbalance: number;
  concentration: number;
  hotspots: LiquidityHotspot[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hashSeed = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) || 1;
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1103515245 + 12345) >>> 0;
    return state / 4294967296;
  };
};

const toNumber = (value: unknown, fallback: number = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildFallbackLiquidityData = (symbol: string, currentPrice: number): LiquidityHeatmapData => {
  const random = createSeededRandom(hashSeed(symbol));
  const bid = 1_400_000 + random() * 1_100_000;
  const ask = 1_250_000 + random() * 1_150_000;
  const imbalance = clamp((bid - ask) / Math.max(bid + ask, 1), -1, 1);
  const concentration = 42 + random() * 30;
  const step = Math.max(currentPrice * 0.0016, 0.0004);

  const hotspots: LiquidityHotspot[] = Array.from({ length: 4 }).map((_, index) => {
    const side: LiquidityHotspot["side"] = index % 2 === 0 ? "bid" : "ask";
    const distance = step * (index + 1) * (0.85 + random() * 0.6);
    const price =
      side === "bid"
        ? Number((currentPrice - distance).toFixed(currentPrice >= 100 ? 2 : 4))
        : Number((currentPrice + distance).toFixed(currentPrice >= 100 ? 2 : 4));
    const liquidity = Math.round(180_000 + random() * 380_000);

    return {
      price,
      side,
      intensity: Math.round(58 + random() * 37),
      liquidity,
      note: side === "bid" ? "Bid wall hỗ trợ hấp thụ sell." : "Ask wall dễ tạo áp lực chốt lời.",
    };
  });

  return {
    symbol,
    source: "liquiheart-demo-fallback",
    updatedAt: new Date().toISOString(),
    totalBidLiquidity: Math.round(bid),
    totalAskLiquidity: Math.round(ask),
    imbalance: Number(imbalance.toFixed(2)),
    concentration: Number(concentration.toFixed(1)),
    hotspots,
  };
};

const normalizeHotspots = (
  rawHotspots: unknown,
  currentPrice: number
): LiquidityHotspot[] => {
  if (!Array.isArray(rawHotspots)) {
    return [];
  }

  return rawHotspots
    .map((item, index): LiquidityHotspot | null => {
      if (typeof item !== "object" || item === null) return null;
      const record = item as Record<string, unknown>;
      const sideValue = String(record.side ?? record.type ?? "bid").toLowerCase();
      const side: LiquidityHotspot["side"] = sideValue === "ask" ? "ask" : "bid";
      const price = toNumber(record.price, currentPrice);
      const liquidity = toNumber(record.liquidity ?? record.size, 0);
      const intensity = clamp(Math.round(toNumber(record.intensity, 65)), 1, 100);

      return {
        price: Number(price.toFixed(currentPrice >= 100 ? 2 : 4)),
        side,
        intensity,
        liquidity,
        note:
          typeof record.note === "string" && record.note.trim().length > 0
            ? record.note
            : side === "bid"
              ? "Bid cụm thanh khoản cao."
              : "Ask cụm thanh khoản cao.",
      };
    })
    .filter((item): item is LiquidityHotspot => item !== null);
};

const normalizeLiquidityResponse = (
  symbol: string,
  payload: unknown,
  currentPrice: number
): LiquidityHeatmapData | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const totalBidLiquidity = toNumber(raw.totalBidLiquidity ?? raw.bidLiquidity);
  const totalAskLiquidity = toNumber(raw.totalAskLiquidity ?? raw.askLiquidity);
  const imbalanceValue =
    raw.imbalance !== undefined
      ? toNumber(raw.imbalance)
      : (totalBidLiquidity - totalAskLiquidity) / Math.max(totalBidLiquidity + totalAskLiquidity, 1);
  const concentration = toNumber(raw.concentration ?? raw.clusterConcentration, 0);
  const hotspots = normalizeHotspots(raw.hotspots ?? raw.clusters, currentPrice);

  if (totalBidLiquidity <= 0 || totalAskLiquidity <= 0) {
    return null;
  }

  return {
    symbol: String(raw.symbol ?? symbol),
    source: String(raw.source ?? "liquiheart-live"),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    totalBidLiquidity: Math.round(totalBidLiquidity),
    totalAskLiquidity: Math.round(totalAskLiquidity),
    imbalance: Number(clamp(imbalanceValue, -1, 1).toFixed(2)),
    concentration: Number(clamp(concentration, 0, 100).toFixed(1)),
    hotspots,
  };
};

export async function fetchLiquidityHeatmap(
  symbol: string,
  currentPrice: number
): Promise<LiquidityHeatmapData> {
  const endpoint = import.meta.env.VITE_LIQUIHEAT_API_URL;
  if (!endpoint) {
    return buildFallbackLiquidityData(symbol, currentPrice);
  }

  try {
    const url = endpoint.startsWith("http")
      ? new URL(endpoint)
      : new URL(endpoint, window.location.origin);
    url.searchParams.set("symbol", symbol);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Liquidity API responded with ${response.status}`);
    }

    const payload = await response.json();
    const normalized = normalizeLiquidityResponse(symbol, payload, currentPrice);
    if (!normalized) {
      throw new Error("Liquidity API payload is missing required fields.");
    }

    if (normalized.hotspots.length === 0) {
      const fallback = buildFallbackLiquidityData(symbol, currentPrice);
      return {
        ...normalized,
        hotspots: fallback.hotspots,
      };
    }

    return normalized;
  } catch (error) {
    console.warn("Liquidity heatmap fallback enabled:", error);
    return buildFallbackLiquidityData(symbol, currentPrice);
  }
}
