import { useMemo, useRef, useState, useEffect } from "react";
import { CandleData } from "@/lib/binanceApi";
import { PivotPoints, SRLevel, TrendLine, EntryMarker } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";

interface CandlestickChartProps {
  candles: CandleData[];
  currentPrice: number;
  pivot: PivotPoints | null;
  srLevels: SRLevel[];
  atr: number;
  trendLines: TrendLine[];
  entryMarkers: EntryMarker[];
}

export default function CandlestickChart({
  candles,
  currentPrice,
  pivot,
  srLevels,
  atr,
  trendLines,
  entryMarkers,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 400, h: 340 });
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        setDims({ w: e.contentRect.width, h: Math.max(320, e.contentRect.height) });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const pad = { top: 14, right: 74, bottom: 24, left: 6 };
  const chartW = dims.w - pad.left - pad.right;
  const chartH = dims.h - pad.top - pad.bottom;

  const { minP, maxP, cW } = useMemo(() => {
    if (!candles.length) return { minP: 0, maxP: 0, cW: 0 };
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const extras: number[] = [currentPrice];
    if (pivot) extras.push(pivot.r1, pivot.s1);
    srLevels.slice(0, 4).forEach((l) => extras.push(l.price));
    trendLines.forEach((tl) => { extras.push(tl.startPrice); extras.push(tl.endPrice); });
    entryMarkers.forEach((m) => extras.push(m.price));
    const allP = [...lows, ...highs, ...extras];
    const min = Math.min(...allP);
    const max = Math.max(...allP);
    const margin = (max - min) * 0.04;
    return { minP: min - margin, maxP: max + margin, cW: chartW / candles.length };
  }, [candles, currentPrice, pivot, srLevels, trendLines, entryMarkers, chartW]);

  const y = (price: number) => {
    if (maxP === minP) return chartH / 2;
    return pad.top + chartH * (1 - (price - minP) / (maxP - minP));
  };

  const gridLines = useMemo(() => {
    const count = 6;
    return Array.from({ length: count + 1 }).map((_, i) => {
      const price = minP + ((maxP - minP) * i) / count;
      return { price, y: y(price) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minP, maxP, dims.h]);

  const hovered = hoveredCandle !== null ? candles[hoveredCandle] : null;

  return (
    <div ref={containerRef} className="w-full h-[360px] relative border-b border-trading-borderColor">
      {hovered && (
        <div className="absolute top-1 left-2 z-10 flex gap-3 text-[9px] animate-fadeIn bg-black/50 rounded px-1.5 py-0.5">
          <span className="text-muted-foreground">O: <span className="text-white">{formatPrice(hovered.open)}</span></span>
          <span className="text-muted-foreground">H: <span className="text-trading-green">{formatPrice(hovered.high)}</span></span>
          <span className="text-muted-foreground">L: <span className="text-trading-red">{formatPrice(hovered.low)}</span></span>
          <span className="text-muted-foreground">C: <span className="text-white">{formatPrice(hovered.close)}</span></span>
        </div>
      )}

      <svg width={dims.w} height={dims.h} className="block" onMouseLeave={() => setHoveredCandle(null)}>
        <defs>
          <linearGradient id="trendGradR" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="trendGradS" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowUp" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,10 L5,0 L10,10" fill="#22c55e" />
          </marker>
          <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L5,10 L10,0" fill="#ef4444" />
          </marker>
        </defs>

        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={`g${i}`}>
            <line x1={pad.left} y1={g.y} x2={dims.w - pad.right} y2={g.y} stroke="#1f2937" strokeWidth={0.4} strokeDasharray="2,4" />
            <text x={dims.w - pad.right + 4} y={g.y + 3} fill="#4b5563" fontSize={8}>{formatPrice(g.price)}</text>
          </g>
        ))}

        {/* Pivot */}
        {pivot && (
          <g>
            <line x1={pad.left} y1={y(pivot.pp)} x2={dims.w - pad.right} y2={y(pivot.pp)} stroke="#f59e0b" strokeWidth={0.6} strokeDasharray="4,3" opacity={0.6} />
            <text x={pad.left + 2} y={y(pivot.pp) - 3} fill="#f59e0b" fontSize={8} opacity={0.7}>PP</text>
            <line x1={pad.left} y1={y(pivot.r1)} x2={dims.w - pad.right} y2={y(pivot.r1)} stroke="#ef4444" strokeWidth={0.5} strokeDasharray="3,4" opacity={0.35} />
            <text x={pad.left + 2} y={y(pivot.r1) - 3} fill="#ef4444" fontSize={7} opacity={0.5}>R1</text>
            <line x1={pad.left} y1={y(pivot.s1)} x2={dims.w - pad.right} y2={y(pivot.s1)} stroke="#22c55e" strokeWidth={0.5} strokeDasharray="3,4" opacity={0.35} />
            <text x={pad.left + 2} y={y(pivot.s1) - 3} fill="#22c55e" fontSize={7} opacity={0.5}>S1</text>
          </g>
        )}

        {/* S/R level lines */}
        {srLevels.slice(0, 4).map((l) => (
          <g key={l.id}>
            <line x1={pad.left} y1={y(l.price)} x2={dims.w - pad.right} y2={y(l.price)} stroke={l.type === "resistance" ? "#ef4444" : "#22c55e"} strokeWidth={0.7} strokeDasharray="5,3" opacity={0.45} />
          </g>
        ))}

        {/* ═══ TREND LINES ═══ */}
        {trendLines.map((tl) => {
          const x1 = pad.left + tl.startIndex * cW + cW / 2;
          const x2 = pad.left + tl.endIndex * cW + cW / 2;
          const y1v = y(tl.startPrice);
          const y2v = y(tl.endPrice);
          const isR = tl.type === "resistance";
          const color = isR ? "#ef4444" : "#22c55e";

          return (
            <g key={tl.id}>
              {/* Glow behind */}
              <line x1={x1} y1={y1v} x2={x2} y2={y2v} stroke={color} strokeWidth={3} opacity={0.15} filter="url(#glow)" />
              {/* Main trend line */}
              <line x1={x1} y1={y1v} x2={x2} y2={y2v} stroke={`url(#${isR ? "trendGradR" : "trendGradS"})`} strokeWidth={1.8} strokeLinecap="round" />
              {/* Touch dots */}
              <circle cx={x1} cy={y1v} r={2.5} fill={color} opacity={0.8}>
                <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={x2} cy={y2v} r={2.5} fill={color} opacity={0.8}>
                <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Label */}
              <text x={x2 + 4} y={y2v - 4} fill={color} fontSize={7} fontWeight="bold" opacity={0.8}>
                {isR ? "▼ Trend R" : "▲ Trend S"} ({tl.touches}t)
              </text>
            </g>
          );
        })}

        {/* Candlesticks */}
        {candles.map((c, i) => {
          const cx = pad.left + i * cW;
          const isGreen = c.close >= c.open;
          const color = isGreen ? "#22c55e" : "#ef4444";
          const bTop = y(Math.max(c.open, c.close));
          const bBot = y(Math.min(c.open, c.close));
          const bH = Math.max(1, bBot - bTop);
          const wickX = cx + cW / 2;
          const barW = Math.max(1, cW * 0.55);
          const isHovered = hoveredCandle === i;

          return (
            <g key={i} className="animate-candleGrow" style={{ animationDelay: `${i * 4}ms` }} onMouseEnter={() => setHoveredCandle(i)}>
              {isHovered && <rect x={cx} y={pad.top} width={cW} height={chartH} fill="rgba(255,255,255,0.03)" />}
              <line x1={wickX} y1={y(c.high)} x2={wickX} y2={y(c.low)} stroke={color} strokeWidth={0.8} />
              <rect x={cx + (cW - barW) / 2} y={bTop} width={barW} height={bH} fill={color} rx={0.5} opacity={isHovered ? 1 : 0.9} />
            </g>
          );
        })}

        {/* ═══ ENTRY/EXIT MARKERS ═══ */}
        {entryMarkers.map((m) => {
          const mx = pad.left + m.index * cW + cW / 2;
          const my = y(m.price);
          const isLong = m.direction === "long";

          if (m.type === "entry") {
            return (
              <g key={m.type}>
                {/* Entry arrow */}
                <line x1={mx} y1={my + (isLong ? 15 : -15)} x2={mx} y2={my} stroke={isLong ? "#22c55e" : "#ef4444"} strokeWidth={2} markerEnd={isLong ? "url(#arrowUp)" : "url(#arrowDown)"} />
                {/* Entry label */}
                <rect x={mx - 32} y={my + (isLong ? 18 : -30)} width={64} height={14} fill={isLong ? "#14532d" : "#7f1d1d"} rx={3} opacity={0.9} />
                <text x={mx} y={my + (isLong ? 28 : -20)} fill="white" fontSize={8} fontWeight="bold" textAnchor="middle">
                  {m.label}
                </text>
                {/* Pulsing circle */}
                <circle cx={mx} cy={my} r={4} fill="none" stroke={isLong ? "#22c55e" : "#ef4444"} strokeWidth={1.5}>
                  <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          }

          if (m.type === "sl") {
            return (
              <g key={m.type}>
                <line x1={pad.left} y1={my} x2={dims.w - pad.right} y2={my} stroke="#ef4444" strokeWidth={0.8} strokeDasharray="3,3" opacity={0.6} />
                <rect x={mx - 24} y={my - 7} width={48} height={14} fill="#7f1d1d" rx={3} opacity={0.85} />
                <text x={mx} y={my + 4} fill="#fca5a5" fontSize={7} fontWeight="bold" textAnchor="middle">SL {formatPrice(m.price)}</text>
              </g>
            );
          }

          if (m.type === "tp1") {
            return (
              <g key={m.type}>
                <line x1={pad.left} y1={my} x2={dims.w - pad.right} y2={my} stroke="#22c55e" strokeWidth={0.8} strokeDasharray="3,3" opacity={0.6} />
                <rect x={mx - 26} y={my - 7} width={52} height={14} fill="#14532d" rx={3} opacity={0.85} />
                <text x={mx} y={my + 4} fill="#86efac" fontSize={7} fontWeight="bold" textAnchor="middle">TP1 {formatPrice(m.price)}</text>
              </g>
            );
          }

          if (m.type === "tp2") {
            return (
              <g key={m.type}>
                <line x1={pad.left} y1={my} x2={dims.w - pad.right} y2={my} stroke="#22c55e" strokeWidth={0.6} strokeDasharray="2,4" opacity={0.4} />
                <rect x={mx + 10} y={my - 7} width={52} height={14} fill="#14532d" rx={3} opacity={0.7} />
                <text x={mx + 36} y={my + 4} fill="#86efac" fontSize={7} textAnchor="middle">TP2 {formatPrice(m.price)}</text>
              </g>
            );
          }

          return null;
        })}

        {/* Current price line */}
        <line x1={pad.left} y1={y(currentPrice)} x2={dims.w - pad.right} y2={y(currentPrice)} stroke="#3b82f6" strokeWidth={0.8} strokeDasharray="2,2">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </line>
        <rect x={dims.w - pad.right} y={y(currentPrice) - 8} width={70} height={16} fill="#3b82f6" rx={3} />
        <text x={dims.w - pad.right + 4} y={y(currentPrice) + 3} fill="white" fontSize={8} fontWeight="bold">{formatPrice(currentPrice)}</text>

        {/* S/R labels on right */}
        {srLevels.slice(0, 3).map((l) => {
          const ly = y(l.price);
          const isR = l.type === "resistance";
          return (
            <g key={`lbl-${l.id}`}>
              <rect x={dims.w - pad.right} y={ly - 8} width={70} height={16} fill={isR ? "#7f1d1d" : "#14532d"} rx={3} opacity={0.8} />
              <text x={dims.w - pad.right + 4} y={ly + 3} fill={isR ? "#fca5a5" : "#86efac"} fontSize={8}>{formatPrice(l.price)}</text>
            </g>
          );
        })}

        {/* Time labels */}
        {candles.filter((_, i) => i % Math.max(1, Math.floor(candles.length / 7)) === 0).map((c, i) => {
          const idx = candles.indexOf(c);
          return <text key={`t${i}`} x={pad.left + idx * cW + cW / 2} y={dims.h - 4} fill="#4b5563" fontSize={8} textAnchor="middle">{c.timeLabel}</text>;
        })}
      </svg>
    </div>
  );
}
