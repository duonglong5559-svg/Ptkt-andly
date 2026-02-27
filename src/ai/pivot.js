#!/usr/bin/env node
/**
 * Pivot Points route.
 *
 * GET /api/pivot?symbol=BTCUSDT&interval=4h&limit=3
 *
 * Uses Binance public API to fetch klines and computes classical pivot points
 * based on the last closed candle (the candle before the current in-progress one).
 *
 * Returns JSON:
 * {
 *   symbol,
 *   interval,
 *   usedCandle: { openTime, open, high, low, close, closeTime },
 *   pivot: { PP, R1, R2, R3, S1, S2, S3 },
 *   fetchedAt
 * }
 */
import fetch from "node-fetch";

/**
 * Compute classical pivot points from high, low, close (numbers).
 * Returns numbers rounded to 2 decimal places.
 */
function computePivotPoints(high, low, close) {
  const H = Number(high);
  const L = Number(low);
  const C = Number(close);

  const PP = (H + L + C) / 3;
  const R1 = 2 * PP - L;
  const S1 = 2 * PP - H;
  const R2 = PP + (H - L);
  const S2 = PP - (H - L);
  const R3 = H + 2 * (PP - L);
  const S3 = L - 2 * (H - PP);

  const round2 = (v) => Math.round(v * 100) / 100;

  return {
    PP: round2(PP),
    R1: round2(R1),
    R2: round2(R2),
    R3: round2(R3),
    S1: round2(S1),
    S2: round2(S2),
    S3: round2(S3),
  };
}

/**
 * Register pivot routes on an Express `app`.
 */
export function registerPivotRoutes(app) {
  app.get("/api/pivot", async (req, res) => {
    const symbol = (req.query.symbol || "BTCUSDT").toUpperCase();
    const interval = req.query.interval || "4h";
    const limit = Math.max(2, Math.min(100, Number(req.query.limit || 3))); // ensure >=2

    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(
      symbol
    )}&interval=${encodeURIComponent(interval)}&limit=${limit}`;

    try {
      const resp = await fetch(binanceUrl, { timeout: 10000 });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({ error: "Binance API error", status: resp.status, body: text });
      }
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(502).json({ error: "Unexpected Binance response", body: data });
      }

      // Choose the last closed candle:
      // Binance returns klines with the most recent (possibly in-progress) as last element.
      // We take data[data.length - 2] if there are >=2 entries, otherwise take last.
      const idx = data.length >= 2 ? data.length - 2 : data.length - 1;
      const k = data[idx];
      // k format: [ openTime, open, high, low, close, ... , closeTime, ...]
      const openTime = k[0];
      const open = k[1];
      const high = k[2];
      const low = k[3];
      const close = k[4];
      const closeTime = k[6];

      const pivot = computePivotPoints(high, low, close);

      return res.json({
        symbol,
        interval,
        usedCandle: {
          openTime,
          open,
          high,
          low,
          close,
          closeTime,
        },
        pivot,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error fetching klines:", err);
      return res.status(500).json({ error: String(err) });
    }
  });
}