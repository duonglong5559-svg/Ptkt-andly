import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { CandleData } from "@/lib/binanceApi";
import { PivotPoints, SRLevel, TrendLine, EntryMarker } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";
import { DrawingToolType, DrawingPoint, Drawing } from "@/hooks/useDrawingTools";
import DrawingLayer from "./DrawingLayer";

interface CandlestickChartProps {
  candles: CandleData[];
  currentPrice: number;
  pivot: PivotPoints | null;
  srLevels: SRLevel[];
  atr: number;
  trendLines: TrendLine[];
  entryMarkers: EntryMarker[];
  activeTool: DrawingToolType;
  drawings: Drawing[];
  activeDrawing: Drawing | null;
  onStartDrawing: (p: DrawingPoint) => void;
  onUpdateDrawing: (p: DrawingPoint) => void;
  onFinishDrawing: () => void;
  onRemoveDrawing: (id: string) => void;
}

export default function CandlestickChart({
  candles, currentPrice, pivot, srLevels, atr, trendLines, entryMarkers,
  activeTool, drawings, activeDrawing,
  onStartDrawing, onUpdateDrawing, onFinishDrawing, onRemoveDrawing,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 400, h: 360 });
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setDims({ w: e.contentRect.width, h: Math.max(320, e.contentRect.height) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const pad = { top: 10, right: 62, bottom: 20, left: 24 };
  const chartW = dims.w - pad.left - pad.right;
  const chartH = dims.h - pad.top - pad.bottom;

  const { minP, maxP, cW } = useMemo(() => {
    if (!candles.length) return { minP: 0, maxP: 0, cW: 0 };
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const extras: number[] = [currentPrice];
    if (pivot) extras.push(pivot.r1, pivot.s1);
    srLevels.slice(0, 3).forEach((l) => extras.push(l.price));
    trendLines.forEach((tl) => { extras.push(tl.startPrice, tl.endPrice); });
    const allP = [...lows, ...highs, ...extras];
    const min = Math.min(...allP);
    const max = Math.max(...allP);
    const margin = (max - min) * 0.03;
    return { minP: min - margin, maxP: max + margin, cW: chartW / candles.length };
  }, [candles, currentPrice, pivot, srLevels, trendLines, chartW]);

  const y = useCallback((price: number) => {
    if (maxP === minP) return chartH / 2;
    return pad.top + chartH * (1 - (price - minP) / (maxP - minP));
  }, [maxP, minP, chartH]);

  const priceFromY = useCallback((yVal: number) => minP + (1 - (yVal - pad.top) / chartH) * (maxP - minP), [minP, maxP, chartH]);
  const indexFromX = useCallback((xVal: number) => Math.max(0, Math.min(candles.length - 1, Math.floor((xVal - pad.left) / cW))), [candles.length, cW]);

  const gridLines = useMemo(() => Array.from({ length: 6 }).map((_, i) => {
    const price = minP + ((maxP - minP) * i) / 5;
    return { price, yv: y(price) };
  }), [minP, maxP, y]);

  const getPoint = useCallback((e: React.MouseEvent<SVGSVGElement>): DrawingPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, price: priceFromY(e.clientY - rect.top), index: indexFromX(e.clientX - rect.left) };
  }, [priceFromY, indexFromX]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "cursor" || activeTool === "crosshair") return;
    onStartDrawing(getPoint(e));
    setIsDrawing(true);
  }, [activeTool, getPoint, onStartDrawing]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setMousePos({ x: mx, y: my });
    const idx = indexFromX(mx);
    if (idx >= 0 && idx < candles.length) setHoveredCandle(idx);
    if (isDrawing) onUpdateDrawing({ x: mx, y: my, price: priceFromY(my), index: idx });
  }, [isDrawing, indexFromX, priceFromY, candles.length, onUpdateDrawing]);

  const handleMouseUp = useCallback(() => { if (isDrawing) { onFinishDrawing(); setIsDrawing(false); } }, [isDrawing, onFinishDrawing]);
  const handleMouseLeave = useCallback(() => { setMousePos(null); setHoveredCandle(null); if (isDrawing) { onFinishDrawing(); setIsDrawing(false); } }, [isDrawing, onFinishDrawing]);

  const hovered = hoveredCandle !== null ? candles[hoveredCandle] : null;
  const showCrosshair = activeTool !== "cursor" && mousePos;

  // Find entry marker for signal badge
  const entryM = entryMarkers.find((m) => m.type === "entry");
  const slM = entryMarkers.find((m) => m.type === "sl");
  const tp1M = entryMarkers.find((m) => m.type === "tp1");

  return (
    <div ref={containerRef} className="w-full h-[360px] relative border-b border-trading-borderColor">
      {hovered && (
        <div className="absolute top-0.5 right-16 z-10 flex gap-1.5 text-[8px] bg-black/70 rounded px-1 py-0.5">
          <span className="text-muted-foreground">O<span className="text-white ml-0.5">{formatPrice(hovered.open)}</span></span>
          <span className="text-muted-foreground">H<span className="text-trading-green ml-0.5">{formatPrice(hovered.high)}</span></span>
          <span className="text-muted-foreground">L<span className="text-trading-red ml-0.5">{formatPrice(hovered.low)}</span></span>
          <span className="text-muted-foreground">C<span className="text-white ml-0.5">{formatPrice(hovered.close)}</span></span>
        </div>
      )}

      <svg width={dims.w} height={dims.h} className="block" style={{ cursor: activeTool === "cursor" ? "default" : "crosshair" }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}>
        <defs>
          <linearGradient id="tgR" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" /></linearGradient>
          <linearGradient id="tgS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0.2" /></linearGradient>
          <filter id="gl"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={pad.left} y1={g.yv} x2={dims.w - pad.right} y2={g.yv} stroke="#1f2937" strokeWidth={0.3} strokeDasharray="2,4" />
            <text x={dims.w - pad.right + 3} y={g.yv + 3} fill="#4b5563" fontSize={7}>{formatPrice(g.price)}</text>
          </g>
        ))}

        {/* Pivot */}
        {pivot && (
          <g>
            <line x1={pad.left} y1={y(pivot.pp)} x2={dims.w - pad.right} y2={y(pivot.pp)} stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="3,3" opacity={0.4} />
            <text x={pad.left + 1} y={y(pivot.pp) - 2} fill="#f59e0b" fontSize={6} opacity={0.5}>PP</text>
          </g>
        )}

        {/* S/R lines (subtle) */}
        {srLevels.slice(0, 3).map((l) => (
          <line key={l.id} x1={pad.left} y1={y(l.price)} x2={dims.w - pad.right} y2={y(l.price)} stroke={l.type === "resistance" ? "#ef4444" : "#22c55e"} strokeWidth={0.5} strokeDasharray="4,3" opacity={0.3} />
        ))}

        {/* TREND LINES */}
        {trendLines.map((tl) => {
          const x1 = pad.left + tl.startIndex * cW + cW / 2;
          const x2 = pad.left + tl.endIndex * cW + cW / 2;
          const y1v = y(tl.startPrice), y2v = y(tl.endPrice);
          const isR = tl.type === "resistance";
          const color = isR ? "#ef4444" : "#22c55e";
          return (
            <g key={tl.id}>
              <line x1={x1} y1={y1v} x2={x2} y2={y2v} stroke={color} strokeWidth={2} opacity={0.1} filter="url(#gl)" />
              <line x1={x1} y1={y1v} x2={x2} y2={y2v} stroke={`url(#${isR ? "tgR" : "tgS"})`} strokeWidth={1.4} strokeLinecap="round" />
              <circle cx={x1} cy={y1v} r={2} fill={color} opacity={0.6}><animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" /></circle>
              <circle cx={x2} cy={y2v} r={2} fill={color} opacity={0.6} />
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
          return (
            <g key={i} onMouseEnter={() => setHoveredCandle(i)}>
              <line x1={wickX} y1={y(c.high)} x2={wickX} y2={y(c.low)} stroke={color} strokeWidth={0.7} />
              <rect x={cx + (cW - barW) / 2} y={bTop} width={barW} height={bH} fill={color} rx={0.3} opacity={hoveredCandle === i ? 1 : 0.85} />
            </g>
          );
        })}

        {/* ═══ ENTRY: just arrow + small label ═══ */}
        {entryM && (() => {
          const mx = pad.left + entryM.index * cW + cW / 2;
          const my = y(entryM.price);
          const isLong = entryM.direction === "long";
          const color = isLong ? "#22c55e" : "#ef4444";
          return (
            <g>
              {/* Entry arrow */}
              <polygon
                points={isLong
                  ? `${mx - 5},${my + 12} ${mx},${my + 2} ${mx + 5},${my + 12}`
                  : `${mx - 5},${my - 12} ${mx},${my - 2} ${mx + 5},${my - 12}`}
                fill={color} opacity={0.9}
              />
              {/* Small label */}
              <rect x={mx - 14} y={my + (isLong ? 14 : -24)} width={28} height={10} fill={color} rx={2} opacity={0.85} />
              <text x={mx} y={my + (isLong ? 22 : -16)} fill="white" fontSize={6} fontWeight="bold" textAnchor="middle">
                {isLong ? "LONG" : "SHORT"}
              </text>
              {/* Pulse */}
              <circle cx={mx} cy={my} r={2} fill="none" stroke={color} strokeWidth={1}>
                <animate attributeName="r" values="2;6;2" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0;0.7" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })()}

        {/* SL line (thin red dashed) */}
        {slM && (
          <g>
            <line x1={pad.left} y1={y(slM.price)} x2={dims.w - pad.right} y2={y(slM.price)} stroke="#ef4444" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.4} />
            <text x={dims.w - pad.right - 2} y={y(slM.price) - 2} fill="#ef4444" fontSize={6} textAnchor="end" opacity={0.6}>SL</text>
          </g>
        )}

        {/* TP1 line (thin green dashed) */}
        {tp1M && (
          <g>
            <line x1={pad.left} y1={y(tp1M.price)} x2={dims.w - pad.right} y2={y(tp1M.price)} stroke="#22c55e" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.4} />
            <text x={dims.w - pad.right - 2} y={y(tp1M.price) - 2} fill="#22c55e" fontSize={6} textAnchor="end" opacity={0.6}>TP</text>
          </g>
        )}

        {/* USER DRAWINGS */}
        <DrawingLayer drawings={drawings} activeDrawing={activeDrawing} chartWidth={dims.w} chartHeight={chartH} padLeft={pad.left} padRight={pad.right} padTop={pad.top} yFn={y} onRemoveDrawing={onRemoveDrawing} />

        {/* Current price */}
        <line x1={pad.left} y1={y(currentPrice)} x2={dims.w - pad.right} y2={y(currentPrice)} stroke="#3b82f6" strokeWidth={0.6} strokeDasharray="2,2">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </line>
        <rect x={dims.w - pad.right} y={y(currentPrice) - 7} width={58} height={14} fill="#3b82f6" rx={2} />
        <text x={dims.w - pad.right + 3} y={y(currentPrice) + 3} fill="white" fontSize={7} fontWeight="bold">{formatPrice(currentPrice)}</text>

        {/* S/R price labels */}
        {srLevels.slice(0, 3).map((l) => {
          const ly = y(l.price);
          const isR = l.type === "resistance";
          return (
            <g key={`lbl-${l.id}`}>
              <rect x={dims.w - pad.right} y={ly - 7} width={58} height={14} fill={isR ? "#7f1d1d" : "#14532d"} rx={2} opacity={0.7} />
              <text x={dims.w - pad.right + 3} y={ly + 3} fill={isR ? "#fca5a5" : "#86efac"} fontSize={7}>{formatPrice(l.price)}</text>
            </g>
          );
        })}

        {/* Crosshair */}
        {showCrosshair && mousePos && mousePos.x > pad.left && mousePos.x < dims.w - pad.right && mousePos.y > pad.top && mousePos.y < dims.h - pad.bottom && (
          <g>
            <line x1={mousePos.x} y1={pad.top} x2={mousePos.x} y2={dims.h - pad.bottom} stroke="#fff" strokeWidth={0.2} strokeDasharray="2,3" opacity={0.3} />
            <line x1={pad.left} y1={mousePos.y} x2={dims.w - pad.right} y2={mousePos.y} stroke="#fff" strokeWidth={0.2} strokeDasharray="2,3" opacity={0.3} />
            <rect x={dims.w - pad.right} y={mousePos.y - 7} width={58} height={14} fill="#374151" rx={2} />
            <text x={dims.w - pad.right + 3} y={mousePos.y + 3} fill="#d1d5db" fontSize={7}>{formatPrice(priceFromY(mousePos.y))}</text>
          </g>
        )}

        {/* Time labels */}
        {candles.filter((_, i) => i % Math.max(1, Math.floor(candles.length / 7)) === 0).map((c, idx) => {
          const i = candles.indexOf(c);
          return <text key={idx} x={pad.left + i * cW + cW / 2} y={dims.h - 3} fill="#4b5563" fontSize={7} textAnchor="middle">{c.timeLabel}</text>;
        })}
      </svg>
    </div>
  );
}
