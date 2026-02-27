import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { CandleData, TradingPair, ResistanceLevel } from "@/data/tradingData";

interface CandlestickChartProps {
  candles: CandleData[];
  pair: TradingPair;
  levels: ResistanceLevel[];
}

export default function CandlestickChart({ candles, pair, levels }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);
  const [chartHeight, setChartHeight] = useState(340);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(0);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDraggingResize(true);
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    dragStartHeight.current = chartHeight;
  }, [chartHeight]);

  useEffect(() => {
    if (!isDraggingResize) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const delta = clientY - dragStartY.current;
      setChartHeight(Math.max(200, Math.min(700, dragStartHeight.current + delta)));
    };
    const handleUp = () => setIsDraggingResize(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDraggingResize]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setZoom((prev) => Math.max(0.5, Math.min(4, prev - e.deltaY * 0.002)));
    } else {
      setPanOffset((prev) => {
        const maxPan = Math.max(0, candles.length - Math.floor(candles.length / zoom));
        return Math.max(-maxPan, Math.min(0, prev + (e.deltaX || e.deltaY) * 0.05));
      });
    }
  }, [candles.length, zoom]);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (isDraggingResize) return;
    setIsPanning(true);
    setPanStart(e.clientX);
  }, [isDraggingResize]);

  useEffect(() => {
    if (!isPanning) return;
    const handleMove = (e: MouseEvent) => {
      const delta = e.clientX - panStart;
      setPanStart(e.clientX);
      setPanOffset((prev) => {
        const maxPan = Math.max(0, candles.length - Math.floor(candles.length / zoom));
        return Math.max(-maxPan, Math.min(0, prev + delta * 0.03));
      });
    };
    const handleUp = () => setIsPanning(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isPanning, panStart, candles.length, zoom]);

  const width = containerWidth;
  const height = chartHeight;
  const padding = { top: 28, right: 80, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const visibleCandles = useMemo(() => {
    const count = Math.max(10, Math.floor(candles.length / zoom));
    const offset = Math.round(panOffset);
    const start = Math.max(0, candles.length - count + offset);
    const end = Math.min(candles.length, start + count);
    return candles.slice(start, end);
  }, [candles, zoom, panOffset]);

  const { minPrice, maxPrice, candleWidth } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 0, candleWidth: 0 };
    const allLows = visibleCandles.map((c) => c.low);
    const allHighs = visibleCandles.map((c) => c.high);
    const levelPrices = levels.map((l) => l.price);
    const allPrices = [...allLows, ...allHighs, ...levelPrices, pair.pivotPrice];
    const min = Math.min(...allPrices) * 0.999;
    const max = Math.max(...allPrices) * 1.001;
    return { minPrice: min, maxPrice: max, candleWidth: chartW / visibleCandles.length };
  }, [visibleCandles, levels, pair, chartW]);

  const priceToY = (price: number) => {
    if (maxPrice === minPrice) return chartH / 2;
    return padding.top + chartH * (1 - (price - minPrice) / (maxPrice - minPrice));
  };

  const resistanceLevels = levels.filter((l) => l.type === "resistance");
  const supportLevels = levels.filter((l) => l.type === "support");

  const trendLine1Start = visibleCandles.length > 10 ? visibleCandles[5] : null;
  const trendLine1End = visibleCandles.length > 10 ? visibleCandles[visibleCandles.length - 5] : null;

  const fmt = (v: number) => v.toFixed(pair.decimals);

  return (
    <div ref={containerRef} className="w-full relative border-b border-trading-borderColor select-none">
      <div className="absolute top-1 right-20 z-10 flex items-center gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(4, z * 1.3))}
          className="w-6 h-6 rounded bg-secondary/60 text-xs text-muted-foreground hover:text-white hover:bg-secondary flex items-center justify-center"
          title="Phóng to"
        >+</button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z / 1.3))}
          className="w-6 h-6 rounded bg-secondary/60 text-xs text-muted-foreground hover:text-white hover:bg-secondary flex items-center justify-center"
          title="Thu nhỏ"
        >−</button>
        <button
          onClick={() => { setZoom(1); setPanOffset(0); }}
          className="w-6 h-6 rounded bg-secondary/60 text-[9px] text-muted-foreground hover:text-white hover:bg-secondary flex items-center justify-center"
          title="Reset"
        >↺</button>
      </div>

      <svg
        width={width}
        height={height}
        className="block cursor-crosshair"
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
      >
        {Array.from({ length: 6 }).map((_, i) => {
          const price = minPrice + ((maxPrice - minPrice) * i) / 5;
          const y = priceToY(price);
          return (
            <g key={`grid-${i}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1f2937" strokeWidth={0.5} strokeDasharray="3,3" />
              <text x={width - padding.right + 5} y={y + 3} fill="#6b7280" fontSize={9}>{fmt(price)}</text>
            </g>
          );
        })}

        {resistanceLevels.map((level) => {
          const y = priceToY(level.price);
          return (
            <g key={level.id}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#ef4444" strokeWidth={0.8} strokeDasharray="6,3" opacity={0.7} />
            </g>
          );
        })}
        {supportLevels.map((level) => {
          const y = priceToY(level.price);
          return (
            <g key={level.id}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#22c55e" strokeWidth={0.8} strokeDasharray="6,3" opacity={0.7} />
            </g>
          );
        })}

        <line
          x1={padding.left} y1={priceToY(pair.pivotPrice)} x2={width - padding.right} y2={priceToY(pair.pivotPrice)}
          stroke="#f59e0b" strokeWidth={0.8} strokeDasharray="4,4" opacity={0.5}
        />

        {trendLine1Start && trendLine1End && (
          <>
            <line
              x1={padding.left + 5 * candleWidth + candleWidth / 2}
              y1={priceToY(trendLine1Start.high * 1.005)}
              x2={padding.left + (visibleCandles.length - 5) * candleWidth + candleWidth / 2}
              y2={priceToY(trendLine1End.high * 0.998)}
              stroke="#f59e0b" strokeWidth={1} opacity={0.4}
            />
            <line
              x1={padding.left + 8 * candleWidth + candleWidth / 2}
              y1={priceToY(visibleCandles[8]?.low * 0.998 || 0)}
              x2={padding.left + (visibleCandles.length - 2) * candleWidth + candleWidth / 2}
              y2={priceToY(visibleCandles[visibleCandles.length - 2]?.low * 1.002 || 0)}
              stroke="#22c55e" strokeWidth={1} opacity={0.4}
            />
          </>
        )}

        {visibleCandles.map((candle, i) => {
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
              <line x1={wickX} y1={priceToY(candle.high)} x2={wickX} y2={priceToY(candle.low)} stroke={color} strokeWidth={1} />
              <rect x={x + (candleWidth - barWidth) / 2} y={bodyTop} width={barWidth} height={bodyHeight} fill={color} rx={0.5} />
            </g>
          );
        })}

        <line
          x1={padding.left} y1={priceToY(pair.currentPrice)} x2={width - padding.right} y2={priceToY(pair.currentPrice)}
          stroke="#3b82f6" strokeWidth={1} strokeDasharray="2,2"
        />

        <g>
          <rect x={width - padding.right} y={priceToY(pair.buyPrice) - 9} width={72} height={18} fill="#22c55e" rx={3} />
          <text x={width - padding.right + 4} y={priceToY(pair.buyPrice) + 3} fill="white" fontSize={9} fontWeight="bold">
            Buy {fmt(pair.buyPrice)}
          </text>
        </g>

        <g>
          <rect x={width - padding.right} y={priceToY(pair.sellPrice) - 9} width={72} height={18} fill="#ef4444" rx={3} />
          <text x={width - padding.right + 4} y={priceToY(pair.sellPrice) + 3} fill="white" fontSize={9} fontWeight="bold">
            Sell {fmt(pair.sellPrice)}
          </text>
        </g>

        {resistanceLevels.slice(0, 2).map((level) => (
          <g key={`label-${level.id}`}>
            <rect x={width - padding.right} y={priceToY(level.price) - 9} width={72} height={18} fill="#7f1d1d" rx={3} opacity={0.8} />
            <text x={width - padding.right + 4} y={priceToY(level.price) + 3} fill="#fca5a5" fontSize={9}>{fmt(level.price)}</text>
          </g>
        ))}

        {visibleCandles
          .filter((_, i) => i % Math.max(1, Math.floor(visibleCandles.length / 6)) === 0)
          .map((candle, i) => {
            const idx = visibleCandles.indexOf(candle);
            return (
              <text key={`time-${i}`} x={padding.left + idx * candleWidth + candleWidth / 2} y={height - 5} fill="#6b7280" fontSize={9} textAnchor="middle">
                {candle.time.split(" ")[0]}
              </text>
            );
          })}
      </svg>

      <div
        className="absolute bottom-0 left-0 right-0 h-3 cursor-row-resize flex items-center justify-center hover:bg-secondary/30 transition-colors group"
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
      >
        <div className="w-8 h-1 rounded-full bg-muted-foreground/30 group-hover:bg-muted-foreground/60 transition-colors" />
      </div>
    </div>
  );
}
