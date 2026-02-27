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
  candles,
  currentPrice,
  pivot,
  srLevels,
  atr,
  trendLines,
  entryMarkers,
  activeTool,
  drawings,
  activeDrawing,
  onStartDrawing,
  onUpdateDrawing,
  onFinishDrawing,
  onRemoveDrawing,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 400, h: 360 });
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setDims({ w: e.contentRect.width, h: Math.max(340, e.contentRect.height) });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const pad = { top: 14, right: 74, bottom: 24, left: 28 };
  const chartW = dims.w - pad.left - pad.right;
  const chartH = dims.h - pad.top - pad.bottom;

  const { minP, maxP, cW } = useMemo(() => {
    if (!candles.length) return { minP: 0, maxP: 0, cW: 0 };
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const extras: number[] = [currentPrice];
    if (pivot) extras.push(pivot.r1, pivot.s1);
    srLevels.slice(0, 4).forEach((l) => extras.push(l.price));
    trendLines.forEach((tl) => { extras.push(tl.startPrice, tl.endPrice); });
    entryMarkers.forEach((m) => extras.push(m.price));
    const allP = [...lows, ...highs, ...extras];
    const min = Math.min(...allP);
    const max = Math.max(...allP);
    const margin = (max - min) * 0.04;
    return { minP: min - margin, maxP: max + margin, cW: chartW / candles.length };
  }, [candles, currentPrice, pivot, srLevels, trendLines, entryMarkers, chartW]);

  const y = useCallback((price: number) => {
    if (maxP === minP) return chartH / 2;
    return pad.top + chartH * (1 - (price - minP) / (maxP - minP));
  }, [maxP, minP, chartH]);

  const priceFromY = useCallback((yVal: number) => {
    return minP + (1 - (yVal - pad.top) / chartH) * (maxP - minP);
  }, [minP, maxP, chartH]);

  const indexFromX = useCallback((xVal: number) => {
    return Math.max(0, Math.min(candles.length - 1, Math.floor((xVal - pad.left) / cW)));
  }, [candles.length, cW]);

  const gridLines = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const price = minP + ((maxP - minP) * i) / 6;
      return { price, yv: y(price) };
    });
  }, [minP, maxP, y]);

  // Mouse handlers
  const getPoint = useCallback((e: React.MouseEvent<SVGSVGElement>): DrawingPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    return { x: mx, y: my, price: priceFromY(my), index: indexFromX(mx) };
  }, [priceFromY, indexFromX]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "cursor" || activeTool === "crosshair") return;
    const pt = getPoint(e);
    onStartDrawing(pt);
    setIsDrawing(true);
  }, [activeTool, getPoint, onStartDrawing]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMousePos({ x: mx, y: my });

    if (activeTool !== "cursor" && activeTool !== "crosshair") {
      const idx = indexFromX(mx);
      if (idx >= 0 && idx < candles.length) setHoveredCandle(idx);
    } else {
      const idx = indexFromX(mx);
      if (idx >= 0 && idx < candles.length) setHoveredCandle(idx);
    }

    if (isDrawing) {
      onUpdateDrawing({ x: mx, y: my, price: priceFromY(my), index: indexFromX(mx) });
    }
  }, [activeTool, isDrawing, indexFromX, priceFromY, candles.length, onUpdateDrawing]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      onFinishDrawing();
      setIsDrawing(false);
    }
  }, [isDrawing, onFinishDrawing]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    setHoveredCandle(null);
    if (isDrawing) {
      onFinishDrawing();
      setIsDrawing(false);
    }
  }, [isDrawing, onFinishDrawing]);

  const hovered = hoveredCandle !== null ? candles[hoveredCandle] : null;
  const cursorStyle =
    activeTool === "crosshair" ? "crosshair" :
    activeTool === "cursor" ? "default" :
    "crosshair";

  const showCrosshair = (activeTool === "crosshair" || activeTool !== "cursor") && mousePos;

  return (
    <div ref={containerRef} className="w-full h-[380px] relative border-b border-trading-borderColor">
      {/* OHLC info */}
      {hovered && (
        <div className="absolute top-1 right-20 z-10 flex gap-2 text-[9px] bg-black/60 rounded px-1.5 py-0.5 animate-fadeIn">
          <span className="text-muted-foreground">O:<span className="text-white ml-0.5">{formatPrice(hovered.open)}</span></span>
          <span className="text-muted-foreground">H:<span className="text-trading-green ml-0.5">{formatPrice(hovered.high)}</span></span>
          <span className="text-muted-foreground">L:<span className="text-trading-red ml-0.5">{formatPrice(hovered.low)}</span></span>
          <span className="text-muted-foreground">C:<span className="text-white ml-0.5">{formatPrice(hovered.close)}</span></span>
        </div>
      )}

      <svg
        width={dims.w} height={dims.h} className="block"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="trendGradR" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="trendGradS" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <marker id="arrowUp" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,10 L5,0 L10,10" fill="#22c55e" /></marker>
          <marker id="arrowDown" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L5,10 L10,0" fill="#ef4444" /></marker>
        </defs>

        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={`g${i}`}>
            <line x1={pad.left} y1={g.yv} x2={dims.w - pad.right} y2={g.yv} stroke="#1f2937" strokeWidth={0.4} strokeDasharray="2,4" />
            <text x={dims.w - pad.right + 4} y={g.yv + 3} fill="#4b5563" fontSize={8}>{formatPrice(g.price)}</text>
          </g>
        ))}

        {/* Pivot */}
        {pivot && (
          <g>
            <line x1={pad.left} y1={y(pivot.pp)} x2={dims.w - pad.right} y2={y(pivot.pp)} stroke="#f59e0b" strokeWidth={0.6} strokeDasharray="4,3" opacity={0.5} />
            <text x={pad.left + 2} y={y(pivot.pp) - 2} fill="#f59e0b" fontSize={7} opacity={0.6}>PP</text>
            <line x1={pad.left} y1={y(pivot.r1)} x2={dims.w - pad.right} y2={y(pivot.r1)} stroke="#ef4444" strokeWidth={0.4} strokeDasharray="3,4" opacity={0.3} />
            <text x={pad.left + 2} y={y(pivot.r1) - 2} fill="#ef4444" fontSize={6} opacity={0.4}>R1</text>
            <line x1={pad.left} y1={y(pivot.s1)} x2={dims.w - pad.right} y2={y(pivot.s1)} stroke="#22c55e" strokeWidth={0.4} strokeDasharray="3,4" opacity={0.3} />
            <text x={pad.left + 2} y={y(pivot.s1) - 2} fill="#22c55e" fontSize={6} opacity={0.4}>S1</text>
          </g>
        )}

        {/* S/R dashed lines */}
        {srLevels.slice(0, 4).map((l) => (
          <line key={l.id} x1={pad.left} y1={y(l.price)} x2={dims.w - pad.right} y2={y(l.price)} stroke={l.type === "resistance" ? "#ef4444" : "#22c55e"} strokeWidth={0.6} strokeDasharray="5,3" opacity={0.4} />
        ))}

        {/* AUTO TREND LINES */}
        {trendLines.map((tl) => {
          const x1 = pad.left + tl.startIndex * cW + cW / 2;
          const x2 = pad.left + tl.endIndex * cW + cW / 2;
          const y1v = y(tl.startPrice);
          const y2v = y(tl.endPrice);
          const isR = tl.type === "resistance";
          const color = isR ? "#ef4444" : "#22c55e";
          return (
            <g key={tl.id}>
              <line x1={x1} y1={y1v} x2={x2} y2={y2v} stroke={color} strokeWidth={2.5} opacity={0.12} filter="url(#glow)" />
              <line x1={x1} y1={y1v} x2={x2} y2={y2v} stroke={`url(#${isR ? "trendGradR" : "trendGradS"})`} strokeWidth={1.6} strokeLinecap="round" />
              <circle cx={x1} cy={y1v} r={2.5} fill={color} opacity={0.7}>
                <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={x2} cy={y2v} r={2.5} fill={color} opacity={0.7}>
                <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x={x2 + 4} y={y2v - 4} fill={color} fontSize={7} fontWeight="bold" opacity={0.7}>
                {isR ? "▼" : "▲"} Trend {isR ? "R" : "S"} ({tl.touches}t)
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
          const isHov = hoveredCandle === i;
          return (
            <g key={i} className="animate-candleGrow" style={{ animationDelay: `${i * 3}ms` }}>
              {isHov && <rect x={cx} y={pad.top} width={cW} height={chartH} fill="rgba(255,255,255,0.02)" />}
              <line x1={wickX} y1={y(c.high)} x2={wickX} y2={y(c.low)} stroke={color} strokeWidth={0.8} />
              <rect x={cx + (cW - barW) / 2} y={bTop} width={barW} height={bH} fill={color} rx={0.5} opacity={isHov ? 1 : 0.9} />
            </g>
          );
        })}

        {/* Entry markers */}
        {entryMarkers.map((m) => {
          const mx = pad.left + m.index * cW + cW / 2;
          const my = y(m.price);
          const isLong = m.direction === "long";
          if (m.type === "entry") return (
            <g key={m.type}>
              <line x1={mx} y1={my + (isLong ? 14 : -14)} x2={mx} y2={my} stroke={isLong ? "#22c55e" : "#ef4444"} strokeWidth={2} markerEnd={isLong ? "url(#arrowUp)" : "url(#arrowDown)"} />
              <rect x={mx - 30} y={my + (isLong ? 16 : -28)} width={60} height={14} fill={isLong ? "#14532d" : "#7f1d1d"} rx={3} opacity={0.9} />
              <text x={mx} y={my + (isLong ? 26 : -18)} fill="white" fontSize={8} fontWeight="bold" textAnchor="middle">{m.label}</text>
              <circle cx={mx} cy={my} r={3} fill="none" stroke={isLong ? "#22c55e" : "#ef4444"} strokeWidth={1.5}>
                <animate attributeName="r" values="3;7;3" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </g>
          );
          if (m.type === "sl") return (
            <g key={m.type}>
              <line x1={pad.left} y1={my} x2={dims.w - pad.right} y2={my} stroke="#ef4444" strokeWidth={0.7} strokeDasharray="3,3" opacity={0.5} />
              <rect x={mx - 28} y={my - 7} width={56} height={14} fill="#7f1d1d" rx={3} opacity={0.8} />
              <text x={mx} y={my + 4} fill="#fca5a5" fontSize={7} fontWeight="bold" textAnchor="middle">SL {formatPrice(m.price)}</text>
            </g>
          );
          if (m.type === "tp1") return (
            <g key={m.type}>
              <line x1={pad.left} y1={my} x2={dims.w - pad.right} y2={my} stroke="#22c55e" strokeWidth={0.7} strokeDasharray="3,3" opacity={0.5} />
              <rect x={mx - 30} y={my - 7} width={60} height={14} fill="#14532d" rx={3} opacity={0.8} />
              <text x={mx} y={my + 4} fill="#86efac" fontSize={7} fontWeight="bold" textAnchor="middle">TP1 {formatPrice(m.price)}</text>
            </g>
          );
          if (m.type === "tp2") return (
            <g key={m.type}>
              <line x1={pad.left} y1={my} x2={dims.w - pad.right} y2={my} stroke="#22c55e" strokeWidth={0.5} strokeDasharray="2,4" opacity={0.35} />
              <rect x={mx + 8} y={my - 7} width={60} height={14} fill="#14532d" rx={3} opacity={0.6} />
              <text x={mx + 38} y={my + 4} fill="#86efac" fontSize={7} textAnchor="middle">TP2 {formatPrice(m.price)}</text>
            </g>
          );
          return null;
        })}

        {/* USER DRAWINGS LAYER */}
        <DrawingLayer
          drawings={drawings}
          activeDrawing={activeDrawing}
          chartWidth={dims.w}
          chartHeight={chartH}
          padLeft={pad.left}
          padRight={pad.right}
          padTop={pad.top}
          yFn={y}
          onRemoveDrawing={onRemoveDrawing}
        />

        {/* Current price */}
        <line x1={pad.left} y1={y(currentPrice)} x2={dims.w - pad.right} y2={y(currentPrice)} stroke="#3b82f6" strokeWidth={0.8} strokeDasharray="2,2">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </line>
        <rect x={dims.w - pad.right} y={y(currentPrice) - 8} width={70} height={16} fill="#3b82f6" rx={3} />
        <text x={dims.w - pad.right + 4} y={y(currentPrice) + 3} fill="white" fontSize={8} fontWeight="bold">{formatPrice(currentPrice)}</text>

        {/* S/R labels */}
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

        {/* Crosshair */}
        {showCrosshair && mousePos && mousePos.x > pad.left && mousePos.x < dims.w - pad.right && mousePos.y > pad.top && mousePos.y < dims.h - pad.bottom && (
          <g>
            <line x1={mousePos.x} y1={pad.top} x2={mousePos.x} y2={dims.h - pad.bottom} stroke="#ffffff" strokeWidth={0.3} strokeDasharray="2,3" opacity={0.4} />
            <line x1={pad.left} y1={mousePos.y} x2={dims.w - pad.right} y2={mousePos.y} stroke="#ffffff" strokeWidth={0.3} strokeDasharray="2,3" opacity={0.4} />
            <rect x={dims.w - pad.right} y={mousePos.y - 8} width={70} height={16} fill="#374151" rx={3} />
            <text x={dims.w - pad.right + 4} y={mousePos.y + 3} fill="#d1d5db" fontSize={8}>{formatPrice(priceFromY(mousePos.y))}</text>
            {hoveredCandle !== null && (
              <>
                <rect x={pad.left + hoveredCandle * cW + cW / 2 - 20} y={dims.h - pad.bottom + 2} width={40} height={14} fill="#374151" rx={3} />
                <text x={pad.left + hoveredCandle * cW + cW / 2} y={dims.h - pad.bottom + 12} fill="#d1d5db" fontSize={7} textAnchor="middle">{candles[hoveredCandle]?.timeLabel}</text>
              </>
            )}
          </g>
        )}

        {/* Time labels */}
        {candles.filter((_, i) => i % Math.max(1, Math.floor(candles.length / 7)) === 0).map((c, idx) => {
          const i = candles.indexOf(c);
          return <text key={`t${idx}`} x={pad.left + i * cW + cW / 2} y={dims.h - 4} fill="#4b5563" fontSize={8} textAnchor="middle">{c.timeLabel}</text>;
        })}
      </svg>
    </div>
  );
}
