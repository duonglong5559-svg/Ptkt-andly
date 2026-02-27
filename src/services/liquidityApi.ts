/**
 * Liquidity API - Tích hợp Coinglass Liquidation Map / Liquiheart
 * Dùng để tính thanh khoản phục vụ phân tích
 * API key: VITE_COINGLASS_API_KEY
 * Docs: https://docs.coinglass.com/reference/liquidation-map
 */

export interface LiquidationCluster {
  price: number;
  shortLiq: number;
  longLiq: number;
  totalLiq: number;
}

export interface LiquidityMapData {
  symbol: string;
  clusters: LiquidationCluster[];
  totalLongLiquidation: number;
  totalShortLiquidation: number;
  timestamp: string;
}

/** Coinglass Liquidation Map API */
async function fetchCoinglassLiquidationMap(symbol: string): Promise<LiquidityMapData | null> {
  const apiKey = import.meta.env.VITE_COINGLASS_API_KEY;
  if (!apiKey) return null;

  const symbolMap: Record<string, string> = {
    "BTC/USDT": "BTC",
    "ETH/USDT": "ETH",
    "XAUUSD": "XAUUSD",
  };
  const coinglassSymbol = symbolMap[symbol] || symbol.replace("/", "");

  try {
    const res = await fetch(
      `https://open-api-v4.coinglass.com/api/futures/liquidation-map?symbol=${coinglassSymbol}&time_type=h1`,
      {
        headers: {
          "CG-API-KEY": apiKey,
          "accept": "application/json",
        },
      }
    );
    const data = await res.json();
    if (data.data) {
      const clusters: LiquidationCluster[] = (data.data.mapData || []).map(
        (m: { price: number; buyVolUsd?: number; sellVolUsd?: number }) => ({
          price: m.price,
          shortLiq: m.sellVolUsd || 0,
          longLiq: m.buyVolUsd || 0,
          totalLiq: (m.buyVolUsd || 0) + (m.sellVolUsd || 0),
        })
      );
      return {
        symbol,
        clusters,
        totalLongLiquidation: clusters.reduce((a, c) => a + c.longLiq, 0),
        totalShortLiquidation: clusters.reduce((a, c) => a + c.shortLiq, 0),
        timestamp: new Date().toISOString(),
      };
    }
  } catch (e) {
    console.warn("Coinglass API error:", e);
  }
  return null;
}

/** Lấy dữ liệu thanh khoản - trả về mock nếu không có API */
export async function fetchLiquidityMap(symbol: string): Promise<LiquidityMapData | null> {
  const data = await fetchCoinglassLiquidationMap(symbol);
  if (data) return data;

  // Mock cho demo khi chưa có API key
  return getMockLiquidityData(symbol);
}

function getMockLiquidityData(symbol: string): LiquidityMapData {
  const base = symbol.includes("BTC") ? 66000 : symbol.includes("XAU") ? 2650 : 3400;
  const clusters: LiquidationCluster[] = [
    { price: base * 0.98, shortLiq: 12e6, longLiq: 8e6, totalLiq: 20e6 },
    { price: base * 1.01, shortLiq: 15e6, longLiq: 22e6, totalLiq: 37e6 },
    { price: base * 1.03, shortLiq: 25e6, longLiq: 10e6, totalLiq: 35e6 },
  ];
  return {
    symbol,
    clusters,
    totalLongLiquidation: 40e6,
    totalShortLiquidation: 52e6,
    timestamp: new Date().toISOString(),
  };
}

export function hasLiquidityApiKey(): boolean {
  return !!import.meta.env.VITE_COINGLASS_API_KEY;
}
