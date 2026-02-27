export interface BinanceFuturesMetrics {
  markPrice: number;
  lastFundingRate: number; // decimal, e.g. 0.0001
  openInterest: number;
}

export async function fetchBinanceFuturesMetrics(args: {
  symbol: string; // e.g. BTCUSDT
  signal?: AbortSignal;
}): Promise<BinanceFuturesMetrics> {
  const premiumUrl = `/api/binance_futures/fapi/v1/premiumIndex?symbol=${encodeURIComponent(args.symbol)}`;
  const oiUrl = `/api/binance_futures/fapi/v1/openInterest?symbol=${encodeURIComponent(args.symbol)}`;

  const [premiumRes, oiRes] = await Promise.all([
    fetch(premiumUrl, { signal: args.signal }),
    fetch(oiUrl, { signal: args.signal }),
  ]);

  if (!premiumRes.ok) throw new Error(`premiumIndex HTTP ${premiumRes.status}`);
  if (!oiRes.ok) throw new Error(`openInterest HTTP ${oiRes.status}`);

  const premium: any = await premiumRes.json();
  const oi: any = await oiRes.json();

  const markPrice = Number(premium?.markPrice);
  const lastFundingRate = Number(premium?.lastFundingRate);
  const openInterest = Number(oi?.openInterest);

  if (![markPrice, lastFundingRate, openInterest].every(Number.isFinite)) {
    throw new Error("Invalid futures metrics");
  }

  return { markPrice, lastFundingRate, openInterest };
}

