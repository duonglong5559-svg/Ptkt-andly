import { useMemo, useRef, useState, useEffect } from "react";
import { CandleData, TradingPair, ResistanceLevel } from "@/data/tradingData";
import { pivotPointsClassic } from "@/lib/ta/pivots";
import type { LiquidityZone } from "@/lib/liquidity/types";

interface CandlestickChartProps {
  candles: CandleData[];
  pair: TradingPair;
  levels: ResistanceLevel[];
  liquidityZones?: LiquidityZone[];
}

export default function CandlestickChart({ candles, pair, levels, liquidityZones }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(280, entry.contentRect.height),
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { width, height } = dimensions;
  const padding = { top: 10, right: 80, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { minPrice, maxPrice, candleWidth } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 0, candleWidth: 0 };
    const allLows = candles.map((c) => c.low);
    const allHighs = candles.map((c) => c.high);
    const levelPrices = levels.map((l) => l.price);
    const allPrices = [...allLows, ...allHighs, ...levelPrices, pair.pivotPrice];
    const min = Math.min(...allPrices) * 0.999;
    const max = Math.max(...allPrices) * 1.001;
    return { minPrice: min, maxPrice: max, candleWidth: chartW / candles.length };
  }, [candles, levels, pair, chartW]);

  const priceToY = (price: number) => {
    if (maxPrice === minPrice) return chartH / 2;
    return padding.top + chartH * (1 - (price - minPrice) / (maxPrice - minPrice));
  };

  const resistanceLevels = levels.filter((l) => l.type === "resistance");
  const supportLevels = levels.filter((l) => l.type === "support");

  const trendLine1Start = candles.length > 10 ? candles[5] : null;
  const trendLine1End = candles.length > 10 ? candles[candles.length - 5] : null;

  const pivots = useMemo(() => {
    const prev = candles[candles.length - 2];
    if (!prev) return null;
    return pivotPointsClassic(prev.high, prev.low, prev.close);
  }, [candles]);

  const pivotLines = useMemo(() => {
    if (!pivots) return [];
    return [
      { key: "pp", price: pivots.pp, color: "#f59e0b", dash: "4,4", opacity: 0.55 },
      { key: "r1", price: pivots.r1, color: "#ef4444", dash: "2,3", opacity: 0.35 },
      { key: "s1", price: pivots.s1, color: "#22c55e", dash: "2,3", opacity: 0.35 },
      { key: "r2", price: pivots.r2, color: "#ef4444", dash: "2,3", opacity: 0.25 },
      { key: "s2", price: pivots.s2, color: "#22c55e", dash: "2,3", opacity: 0.25 },
    ];
  }, [pivots]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[280px] relative border-b border-trading-borderColor">
      <svg width={width} height={height} className="block">
        {/* Liquidity heatmap zones */}
        {(liquidityZones ?? []).map((z, i) => {
          const yTop = priceToY(Math.max(z.low, z.high));
          const yBot = priceToY(Math.min(z.low, z.high));
          const h = Math.max(1, yBot - yTop);
          const alpha = Math.max(0.06, Math.min(0.22, (z.intensity ?? 0.6) * 0.22));
          return (
            <rect
              key={`liq-${i}`}
              x={padding.left}
              y={yTop}
              width={width - padding.left - padding.right}
              height={h}
              fill={`rgba(59, 130, 246, ${alpha})`}
            />
          );
        })}

        {/* Grid lines */}
        {Array.from({ length: 6 }).map((_, i) => {
          const price = minPrice + ((maxPrice - minPrice) * i) / 5;
          const y = priceToY(price);
          return (
            <g key={`grid-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1f2937"
                strokeWidth={0.5}
                strokeDasharray="3,3"
              />
              <text
                x={width - padding.right + 5}
                y={y + 3}
                fill="#6b7280"
                fontSize={9}
              >
                {price.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Support/Resistance level lines */}
        {resistanceLevels.map((level) => {
          const y = priceToY(level.price);
          return (
            <g key={level.id}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#ef4444"
                strokeWidth={0.8}
                strokeDasharray="6,3"
                opacity={0.7}
              />
            </g>
          );
        })}
        {supportLevels.map((level) => {
          const y = priceToY(level.price);
          return (
            <g key={level.id}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#22c55e"
                strokeWidth={0.8}
                strokeDasharray="6,3"
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* Pivot line */}
        {pivotLines.map((pl) => (
          <line
            key={pl.key}
            x1={padding.left}
            y1={priceToY(pl.price)}
            x2={width - padding.right}
            y2={priceToY(pl.price)}
            stroke={pl.color}
            strokeWidth={0.8}
            strokeDasharray={pl.dash}
            opacity={pl.opacity}
          />
        ))}

        {/* Trend lines */}
        {trendLine1Start && trendLine1End && (
          <>
            <line
              x1={padding.left + 5 * candleWidth + candleWidth / 2}
              y1={priceToY(trendLine1Start.high * 1.005)}
              x2={padding.left + (candles.length - 5) * candleWidth + candleWidth / 2}
              y2={priceToY(trendLine1End.high * 0.998)}
              stroke="#f59e0b"
              strokeWidth={1}
              opacity={0.4}
            />
            <line
              x1={padding.left + 8 * candleWidth + candleWidth / 2}
              y1={priceToY(candles[8]?.low * 0.998 || 0)}
              x2={padding.left + (candles.length - 2) * candleWidth + candleWidth / 2}
              y2={priceToY(candles[candles.length - 2]?.low * 1.002 || 0)}
              stroke="#22c55e"
              strokeWidth={1}
              opacity={0.4}
            />
          </>
        )}

        {/* Candlesticks */}
        {candles.map((candle, i) => {
          const x = padding.left + i * candleWidth;
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? "#22c55e" : "#ef4444";
          const bodyTop = priceToY(Math.max(candle.open, candle.close));
          const bodyBottom = priceToY(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);
          const wickX = x + candleWidth / 2;
          const barWidth = Math.max(1, candleWidth * 0.6);

          return (
            <g key={i}>
              <line
                x1={wickX}
                y1={priceToY(candle.high)}
                x2={wickX}
                y2={priceToY(candle.low)}
                stroke={color}
                strokeWidth={1}
              />
              <rect
                x={x + (candleWidth - barWidth) / 2}
                y={bodyTop}
                width={barWidth}
                height={bodyHeight}
                fill={color}
                rx={0.5}
              />
            </g>
          );
        })}

        {/* Current price line + label */}
        <line
          x1={padding.left}
          y1={priceToY(pair.currentPrice)}
          x2={width - padding.right}
          y2={priceToY(pair.currentPrice)}
          stroke="#3b82f6"
          strokeWidth={1}
          strokeDasharray="2,2"
        />

        {/* Buy label */}
        <g>
          <rect
            x={width - padding.right}
            y={priceToY(pair.buyPrice) - 9}
            width={72}
            height={18}
            fill="#22c55e"
            rx={3}
          />
          <text
            x={width - padding.right + 4}
            y={priceToY(pair.buyPrice) + 3}
            fill="white"
            fontSize={9}
            fontWeight="bold"
          >
            Buy {pair.buyPrice.toFixed(2)}
          </text>
        </g>

        {/* Sell label */}
        <g>
          <rect
            x={width - padding.right}
            y={priceToY(pair.sellPrice) - 9}
            width={72}
            height={18}
            fill="#ef4444"
            rx={3}
          />
          <text
            x={width - padding.right + 4}
            y={priceToY(pair.sellPrice) + 3}
            fill="white"
            fontSize={9}
            fontWeight="bold"
          >
            Sell {pair.sellPrice.toFixed(2)}
          </text>
        </g>

        {/* Price labels on right */}
        {resistanceLevels.slice(0, 2).map((level) => (
          <g key={`label-${level.id}`}>
            <rect
              x={width - padding.right}
              y={priceToY(level.price) - 9}
              width={72}
              height={18}
              fill="#7f1d1d"
              rx={3}
              opacity={0.8}
            />
            <text
              x={width - padding.right + 4}
              y={priceToY(level.price) + 3}
              fill="#fca5a5"
              fontSize={9}
            >
              {level.price.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Time labels */}
        {candles
          .filter((_, i) => i % Math.max(1, Math.floor(candles.length / 6)) === 0)
          .map((candle, i, arr) => {
            const idx = candles.indexOf(candle);
            return (
              <text
                key={`time-${i}`}
                x={padding.left + idx * candleWidth + candleWidth / 2}
                y={height - 5}
                fill="#6b7280"
                fontSize={9}
                textAnchor="middle"
              >
                {candle.time.split(" ")[0]}
              </text>
            );
          })}
      </svg>

      {/* Price info overlay */}
      <div className="absolute top-2 left-3 text-[11px] text-muted-foreground space-y-0.5">
        <div>
          Pivot (Classic) + SR cứng (hard SR)
        </div>
      </div>
    </div>
  );
}
