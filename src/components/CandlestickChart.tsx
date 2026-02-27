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
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Zoom & pan state
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(0);
  const viewStartRef = useRef(0);

  useEffect(() => {
    if (candles.length > 0 && viewEnd === 0) {
      setViewStart(Math.max(0, candles.length - 60));
      setViewEnd(candles.length);
    }
  }, [candles.length, viewEnd]);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setDims({ w: e.contentRect.width, h: Math.max(320, e.contentRect.height) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const visibleCandles = useMemo(() => candles.slice(viewStart, viewEnd), [candles, viewStart, viewEnd]);
  const visibleCount = viewEnd - viewStart;

  const pad = { top: 8, right: 62, bottom: 18, left: 22 };
  const chartW = dims.w - pad.left - pad.right;
  const chartH = dims.h - pad.top - pad.bottom;

  const { minP, maxP, cW } = useMemo(() => {
    if (!visibleCandles.length) return { minP: 0, maxP: 0, cW: 0 };
    let lo = Infinity, hi = -Infinity;
    for (const c of visibleCandles) { if (c.low < lo) lo = c.low; if (c.high > hi) hi = c.high; }
    const extras = [currentPrice];
    if (pivot) extras.push(pivot.r1, pivot.s1);
    for (const p of extras) { if (p < lo) lo = p; if (p > hi) hi = p; }
    const margin = (hi - lo) * 0.04;
    return { minP: lo - margin, maxP: hi + margin, cW: chartW / visibleCount };
  }, [visibleCandles, currentPrice, pivot, chartW, visibleCount]);

  const y = useCallback((price: number) => {
    if (maxP === minP) return chartH / 2;
    return pad.top + chartH * (1 - (price - minP) / (maxP - minP));
  }, [maxP, minP, chartH]);

  const priceFromY = useCallback((yVal: number) => minP + (1 - (yVal - pad.top) / chartH) * (maxP - minP), [minP, maxP, chartH]);
  const indexFromX = useCallback((xVal: number) => Math.max(0, Math.min(visibleCandles.length - 1, Math.floor((xVal - pad.left) / cW))), [visibleCandles.length, cW]);

  const gridLines = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const price = minP + ((maxP - minP) * i) / 6;
    return { price, yv: y(price) };
  }), [minP, maxP, y]);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDir = e.deltaY > 0 ? 1 : -1;
    const minVisible = 15;
    const maxVisible = candles.length;
    const center = (viewStart + viewEnd) / 2;
    const half = visibleCount / 2;
    const newHalf = Math.max(minVisible / 2, Math.min(maxVisible / 2, half + zoomDir * 3));
    const ns = Math.max(0, Math.round(center - newHalf));
    const ne = Math.min(candles.length, Math.round(center + newHalf));
    setViewStart(ns);
    setViewEnd(ne);
  }, [candles.length, viewStart, viewEnd, visibleCount]);

  // Touch zoom (pinch)
  const lastTouchDist = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1 && activeTool === "cursor") {
      setIsPanning(true);
      panStartRef.current = e.touches[0].clientX;
      viewStartRef.current = viewStart;
    }
  }, [activeTool, viewStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const diff = dist - lastTouchDist.current;
      if (Math.abs(diff) > 5) {
        const zoomDir = diff > 0 ? -1 : 1;
        const center = (viewStart + viewEnd) / 2;
        const half = visibleCount / 2;
        const newHalf = Math.max(7, Math.min(candles.length / 2, half + zoomDir * 2));
        setViewStart(Math.max(0, Math.round(center - newHalf)));
        setViewEnd(Math.min(candles.length, Math.round(center + newHalf)));
        lastTouchDist.current = dist;
      }
    } else if (e.touches.length === 1 && isPanning) {
      const dx = e.touches[0].clientX - panStartRef.current;
      const candlesMoved = Math.round(-dx / Math.max(1, cW));
      const ns = Math.max(0, Math.min(candles.length - 15, viewStartRef.current + candlesMoved));
      const ne = ns + visibleCount;
      if (ne <= candles.length) { setViewStart(ns); setViewEnd(ne); }
    }
  }, [isPanning, viewStart, viewEnd, visibleCount, candles.length, cW]);

  const handleTouchEnd = useCallback(() => { setIsPanning(false); }, []);

  // Mouse pan (hold and drag on cursor mode)
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool !== "cursor" && activeTool !== "crosshair") {
      const rect = e.currentTarget.getBoundingClientRect();
      onStartDrawing({ x: e.clientX - rect.left, y: e.clientY - rect.top, price: priceFromY(e.clientY - rect.top), index: indexFromX(e.clientX - rect.left) });
      setIsDrawingMode(true);
      return;
    }
    if (activeTool === "cursor") {
      setIsPanning(true);
      panStartRef.current = e.clientX;
      viewStartRef.current = viewStart;
    }
  }, [activeTool, priceFromY, indexFromX, onStartDrawing, viewStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setMousePos({ x: mx, y: my });
    const idx = indexFromX(mx);
    if (idx >= 0 && idx < visibleCandles.length) setHoveredCandle(idx);

    if (isDrawingMode) {
      onUpdateDrawing({ x: mx, y: my, price: priceFromY(my), index: idx });
    } else if (isPanning) {
      const dx = e.clientX - panStartRef.current;
      const candlesMoved = Math.round(-dx / Math.max(1, cW));
      const ns = Math.max(0, Math.min(candles.length - 15, viewStartRef.current + candlesMoved));
      const ne = ns + visibleCount;
      if (ne <= candles.length) { setViewStart(ns); setViewEnd(ne); }
    }
  }, [isDrawingMode, isPanning, indexFromX, visibleCandles.length, priceFromY, onUpdateDrawing, cW, candles.length, visibleCount]);

  const handleMouseUp = useCallback(() => {
    if (isDrawingMode) { onFinishDrawing(); setIsDrawingMode(false); }
    setIsPanning(false);
  }, [isDrawingMode, onFinishDrawing]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null); setHoveredCandle(null);
    if (isDrawingMode) { onFinishDrawing(); setIsDrawingMode(false); }
    setIsPanning(false);
  }, [isDrawingMode, onFinishDrawing]);

  const hovered = hoveredCandle !== null ? visibleCandles[hoveredCandle] : null;
  const showCrosshair = activeTool !== "cursor" && mousePos;
  const RX = dims.w - pad.right;

  const entryM = entryMarkers.find((m) => m.type === "entry");
  const slM = entryMarkers.find((m) => m.type === "sl");
  const tp1M = entryMarkers.find((m) => m.type === "tp1");

  return (
    <div ref={containerRef} className="w-full h-[360px] relative border-b border-trading-borderColor touch-none">
      {hovered && (
        <div className="absolute top-0.5 right-16 z-10 flex gap-1 text-[7px] bg-black/70 rounded px-1 py-0.5">
          <span className="text-muted-foreground">O<span className="text-white ml-0.5">{formatPrice(hovered.open)}</span></span>
          <span className="text-muted-foreground">H<span className="text-trading-green ml-0.5">{formatPrice(hovered.high)}</span></span>
          <span className="text-muted-foreground">L<span className="text-trading-red ml-0.5">{formatPrice(hovered.low)}</span></span>
          <span className="text-muted-foreground">C<span className="text-white ml-0.5">{formatPrice(hovered.close)}</span></span>
        </div>
      )}

      <svg width={dims.w} height={dims.h} className="block" style={{ cursor: isPanning ? "grabbing" : activeTool === "cursor" ? "grab" : "crosshair" }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}>
        <defs>
          <linearGradient id="tgR" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" /></linearGradient>
          <linearGradient id="tgS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0.2" /></linearGradient>
          <filter id="gl"><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={pad.left} y1={g.yv} x2={RX} y2={g.yv} stroke="#1f2937" strokeWidth={0.3} strokeDasharray="2,4" />
            <text x={RX + 3} y={g.yv + 3} fill="#6b7280" fontSize={7}>{formatPrice(g.price)}</text>
          </g>
        ))}

        {/* Pivot */}
        {pivot && (
          <g>
            <line x1={pad.left} y1={y(pivot.pp)} x2={RX} y2={y(pivot.pp)} stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="3,3" opacity={0.4} />
            <text x={pad.left + 1} y={y(pivot.pp) - 1} fill="#f59e0b" fontSize={6} opacity={0.5}>PP</text>
          </g>
        )}

        {/* S/R dashed lines */}
        {srLevels.slice(0, 4).map((l) => (
          <line key={l.id} x1={pad.left} y1={y(l.price)} x2={RX} y2={y(l.price)} stroke={l.type === "resistance" ? "#ef4444" : "#22c55e"} strokeWidth={0.5} strokeDasharray="4,3" opacity={0.3} />
        ))}

        {/* TREND LINES (adjusted to visible range) */}
        {trendLines.map((tl) => {
          const si = tl.startIndex - viewStart;
          const ei = tl.endIndex - viewStart;
          if (ei < 0 || si >= visibleCount) return null;
          const x1 = pad.left + Math.max(0, si) * cW + cW / 2;
          const x2 = pad.left + Math.min(visibleCount - 1, ei) * cW + cW / 2;
          const slope = (tl.endPrice - tl.startPrice) / (tl.endIndex - tl.startIndex);
          const y1p = tl.startPrice + slope * (Math.max(0, si) - (tl.startIndex - viewStart));
          const y2p = tl.startPrice + slope * (Math.min(visibleCount - 1, ei) - (tl.startIndex - viewStart));
          const isR = tl.type === "resistance";
          const color = isR ? "#ef4444" : "#22c55e";
          return (
            <g key={tl.id}>
              <line x1={x1} y1={y(y1p)} x2={x2} y2={y(y2p)} stroke={color} strokeWidth={2} opacity={0.1} filter="url(#gl)" />
              <line x1={x1} y1={y(y1p)} x2={x2} y2={y(y2p)} stroke={`url(#${isR ? "tgR" : "tgS"})`} strokeWidth={1.4} strokeLinecap="round" />
              <circle cx={x1} cy={y(y1p)} r={2} fill={color} opacity={0.6} />
              <circle cx={x2} cy={y(y2p)} r={2} fill={color} opacity={0.6} />
            </g>
          );
        })}

        {/* Candlesticks */}
        {visibleCandles.map((c, i) => {
          const cx = pad.left + i * cW;
          const isGreen = c.close >= c.open;
          const color = isGreen ? "#22c55e" : "#ef4444";
          const bTop = y(Math.max(c.open, c.close));
          const bBot = y(Math.min(c.open, c.close));
          const bH = Math.max(1, bBot - bTop);
          const wickX = cx + cW / 2;
          const barW = Math.max(1, cW * 0.6);
          return (
            <g key={i} onMouseEnter={() => setHoveredCandle(i)}>
              <line x1={wickX} y1={y(c.high)} x2={wickX} y2={y(c.low)} stroke={color} strokeWidth={Math.min(1, cW * 0.15)} />
              <rect x={cx + (cW - barW) / 2} y={bTop} width={barW} height={bH} fill={color} rx={0.3} opacity={hoveredCandle === i ? 1 : 0.85} />
            </g>
          );
        })}

        {/* SL/TP thin dashed lines */}
        {slM && slM.price > 0 && <line x1={pad.left} y1={y(slM.price)} x2={RX} y2={y(slM.price)} stroke="#ef4444" strokeWidth={0.4} strokeDasharray="2,3" opacity={0.3} />}
        {tp1M && tp1M.price > 0 && <line x1={pad.left} y1={y(tp1M.price)} x2={RX} y2={y(tp1M.price)} stroke="#22c55e" strokeWidth={0.4} strokeDasharray="2,3" opacity={0.3} />}

        {/* User drawings */}
        <DrawingLayer drawings={drawings} activeDrawing={activeDrawing} chartWidth={dims.w} chartHeight={chartH} padLeft={pad.left} padRight={pad.right} padTop={pad.top} yFn={y} onRemoveDrawing={onRemoveDrawing} />

        {/* Sell label */}
        {entryM && entryM.direction === "short" && (
          <g><rect x={RX} y={y(entryM.price) - 7} width={58} height={14} fill="#ef4444" rx={2} /><text x={RX + 3} y={y(entryM.price) + 3} fill="white" fontSize={7} fontWeight="bold">Sell {formatPrice(entryM.price)}</text></g>
        )}
        {/* Buy label */}
        {entryM && entryM.direction === "long" && (
          <g><rect x={RX} y={y(entryM.price) - 7} width={58} height={14} fill="#22c55e" rx={2} /><text x={RX + 3} y={y(entryM.price) + 3} fill="white" fontSize={7} fontWeight="bold">Buy {formatPrice(entryM.price)}</text></g>
        )}

        {/* Current price */}
        <line x1={pad.left} y1={y(currentPrice)} x2={RX} y2={y(currentPrice)} stroke="#3b82f6" strokeWidth={0.6} strokeDasharray="2,2">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </line>
        <rect x={RX} y={y(currentPrice) - 7} width={58} height={14} fill="#3b82f6" rx={2} />
        <text x={RX + 3} y={y(currentPrice) + 3} fill="white" fontSize={7} fontWeight="bold">{formatPrice(currentPrice)}</text>

        {/* S/R labels */}
        {srLevels.slice(0, 3).map((l) => {
          const ly = y(l.price); const isR = l.type === "resistance";
          const conflict = [currentPrice, entryM?.price || 0].some((p) => p > 0 && Math.abs(y(p) - ly) < 16);
          if (conflict) return null;
          return <g key={`lbl-${l.id}`}><rect x={RX} y={ly - 7} width={58} height={14} fill={isR ? "#b91c1c" : "#166534"} rx={2} opacity={0.7} /><text x={RX + 3} y={ly + 3} fill={isR ? "#fecaca" : "#bbf7d0"} fontSize={7}>{formatPrice(l.price)}</text></g>;
        })}

        {/* Crosshair */}
        {showCrosshair && mousePos && mousePos.x > pad.left && mousePos.x < RX && mousePos.y > pad.top && mousePos.y < dims.h - pad.bottom && (
          <g>
            <line x1={mousePos.x} y1={pad.top} x2={mousePos.x} y2={dims.h - pad.bottom} stroke="#fff" strokeWidth={0.2} strokeDasharray="2,3" opacity={0.3} />
            <line x1={pad.left} y1={mousePos.y} x2={RX} y2={mousePos.y} stroke="#fff" strokeWidth={0.2} strokeDasharray="2,3" opacity={0.3} />
            <rect x={RX} y={mousePos.y - 7} width={58} height={14} fill="#374151" rx={2} />
            <text x={RX + 3} y={mousePos.y + 3} fill="#d1d5db" fontSize={7}>{formatPrice(priceFromY(mousePos.y))}</text>
          </g>
        )}

        {/* Time labels */}
        {visibleCandles.filter((_, i) => i % Math.max(1, Math.floor(visibleCount / 6)) === 0).map((c, idx) => {
          const i = visibleCandles.indexOf(c);
          return <text key={idx} x={pad.left + i * cW + cW / 2} y={dims.h - 2} fill="#4b5563" fontSize={7} textAnchor="middle">{c.timeLabel}</text>;
        })}
      </svg>
    </div>
  );
}
