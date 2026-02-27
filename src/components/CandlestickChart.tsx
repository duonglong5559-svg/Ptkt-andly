import { MouseEvent, TouchEvent, WheelEvent, useMemo, useRef, useState, useEffect } from "react";
import { CandleData, TradingPair, ResistanceLevel } from "@/data/tradingData";

interface CandlestickChartProps {
  candles: CandleData[];
  pair: TradingPair;
  levels: ResistanceLevel[];
  pivotPrice: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const MIN_VISIBLE_CANDLES = 16;
const MAX_ZOOM = 4;

const getVisibleCount = (totalCandles: number, zoomScale: number) => {
  if (totalCandles <= 0) return 0;
  return clamp(Math.round(totalCandles / zoomScale), Math.min(totalCandles, MIN_VISIBLE_CANDLES), totalCandles);
};

export default function CandlestickChart({ candles, pair, levels, pivotPrice }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [zoomScale, setZoomScale] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ startX: number; startIndex: number } | null>(null);

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
  const visibleCount = getVisibleCount(candles.length, zoomScale);
  const maxStartIndex = Math.max(0, candles.length - visibleCount);

  useEffect(() => {
    setStartIndex((prev) => clamp(prev, 0, maxStartIndex));
  }, [maxStartIndex]);

  const updateZoom = (nextZoom: number, anchorRatio: number = 1) => {
    const safeNextZoom = clamp(nextZoom, 1, MAX_ZOOM);
    if (safeNextZoom === zoomScale || candles.length === 0) {
      return;
    }

    const currentVisibleCount = getVisibleCount(candles.length, zoomScale);
    const nextVisibleCount = getVisibleCount(candles.length, safeNextZoom);
    const safeAnchorRatio = clamp(anchorRatio, 0, 1);
    const anchorIndex = startIndex + Math.round(currentVisibleCount * safeAnchorRatio);
    const nextStart = clamp(
      anchorIndex - Math.round(nextVisibleCount * safeAnchorRatio),
      0,
      Math.max(0, candles.length - nextVisibleCount)
    );

    setZoomScale(safeNextZoom);
    setStartIndex(nextStart);
  };

  const visibleCandles = useMemo(
    () => candles.slice(startIndex, startIndex + visibleCount),
    [candles, startIndex, visibleCount]
  );

  const { minPrice, maxPrice, candleWidth } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 0, candleWidth: 0 };
    const allLows = visibleCandles.map((c) => c.low);
    const allHighs = visibleCandles.map((c) => c.high);
    const levelPrices = levels.map((l) => l.price);
    const allPrices = [...allLows, ...allHighs, ...levelPrices, pivotPrice, pair.currentPrice];
    const min = Math.min(...allPrices) * 0.999;
    const max = Math.max(...allPrices) * 1.001;
    return { minPrice: min, maxPrice: max, candleWidth: chartW / visibleCandles.length };
  }, [visibleCandles, levels, pivotPrice, pair.currentPrice, chartW]);

  const priceToY = (price: number) => {
    if (maxPrice === minPrice) return chartH / 2;
    return padding.top + chartH * (1 - (price - minPrice) / (maxPrice - minPrice));
  };

  const resistanceLevels = levels.filter((l) => l.type === "resistance");
  const supportLevels = levels.filter((l) => l.type === "support");

  const trendLine1Start = visibleCandles.length > 10 ? visibleCandles[5] : null;
  const trendLine1End = visibleCandles.length > 10 ? visibleCandles[visibleCandles.length - 5] : null;

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!containerRef.current || chartW <= 0) return;

    const bounds = containerRef.current.getBoundingClientRect();
    const relativeX = event.clientX - bounds.left - padding.left;
    const anchorRatio = clamp(relativeX / chartW, 0, 1);
    const delta = event.deltaY < 0 ? 0.2 : -0.2;
    updateZoom(zoomScale + delta, anchorRatio);
  };

  const beginDrag = (clientX: number) => {
    if (candles.length <= visibleCount) return;
    dragStateRef.current = { startX: clientX, startIndex };
    setIsDragging(true);
  };

  const moveDrag = (clientX: number) => {
    if (!dragStateRef.current || candleWidth <= 0) return;
    const deltaX = clientX - dragStateRef.current.startX;
    const candlesMoved = Math.round(-deltaX / candleWidth);
    const nextStart = clamp(dragStateRef.current.startIndex + candlesMoved, 0, maxStartIndex);
    setStartIndex(nextStart);
  };

  const stopDrag = () => {
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleMouseDown = (event: MouseEvent<SVGSVGElement>) => beginDrag(event.clientX);
  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => moveDrag(event.clientX);
  const handleTouchStart = (event: TouchEvent<SVGSVGElement>) => beginDrag(event.touches[0]?.clientX ?? 0);
  const handleTouchMove = (event: TouchEvent<SVGSVGElement>) => moveDrag(event.touches[0]?.clientX ?? 0);
  const timeLabelStep = Math.max(1, Math.floor(visibleCandles.length / 6));

  return (
    <div
      ref={containerRef}
      className="w-full h-[320px] relative border-b border-trading-borderColor touch-none"
      onWheel={handleWheel}
    >
      <svg
        width={width}
        height={height}
        className={`block select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrag}
      >
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
        <line
          x1={padding.left}
          y1={priceToY(pivotPrice)}
          x2={width - padding.right}
          y2={priceToY(pivotPrice)}
          stroke="#f59e0b"
          strokeWidth={0.8}
          strokeDasharray="4,4"
          opacity={0.5}
        />

        {/* Trend lines */}
        {trendLine1Start && trendLine1End && (
          <>
            <line
              x1={padding.left + 5 * candleWidth + candleWidth / 2}
              y1={priceToY(trendLine1Start.high * 1.005)}
              x2={padding.left + (visibleCandles.length - 5) * candleWidth + candleWidth / 2}
              y2={priceToY(trendLine1End.high * 0.998)}
              stroke="#f59e0b"
              strokeWidth={1}
              opacity={0.4}
            />
            <line
              x1={padding.left + 8 * candleWidth + candleWidth / 2}
              y1={priceToY(visibleCandles[8]?.low * 0.998 || 0)}
              x2={padding.left + (visibleCandles.length - 2) * candleWidth + candleWidth / 2}
              y2={priceToY(visibleCandles[visibleCandles.length - 2]?.low * 1.002 || 0)}
              stroke="#22c55e"
              strokeWidth={1}
              opacity={0.4}
            />
          </>
        )}

        {/* Candlesticks */}
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
        {visibleCandles
          .map((candle, index) => ({ candle, index }))
          .filter(({ index }) => index % timeLabelStep === 0 || index === visibleCandles.length - 1)
          .map(({ candle, index }) => (
            <text
              key={`time-${index}`}
              x={padding.left + index * candleWidth + candleWidth / 2}
              y={height - 5}
              fill="#6b7280"
              fontSize={9}
              textAnchor="middle"
            >
              {candle.time.split(" ")[0]}
            </text>
          ))}
      </svg>

      <div className="absolute top-2 right-3 z-10 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-1 text-[10px]">
        <button
          className="rounded bg-secondary/70 px-1.5 py-0.5 text-white hover:bg-secondary"
          onClick={() => updateZoom(zoomScale - 0.2)}
          type="button"
        >
          -
        </button>
        <span className="min-w-[32px] text-center text-muted-foreground">{zoomScale.toFixed(1)}x</span>
        <button
          className="rounded bg-secondary/70 px-1.5 py-0.5 text-white hover:bg-secondary"
          onClick={() => updateZoom(zoomScale + 0.2)}
          type="button"
        >
          +
        </button>
        <button
          className="rounded bg-secondary/70 px-1.5 py-0.5 text-white hover:bg-secondary"
          onClick={() => {
            setZoomScale(1);
            setStartIndex(0);
          }}
          type="button"
        >
          Reset
        </button>
      </div>

      {/* Price info overlay */}
      <div className="absolute top-2 left-3 text-[11px] text-muted-foreground space-y-0.5">
        <div>
          Zoom/Pan: lăn chuột để kéo dãn, kéo ngang để pan biểu đồ.
        </div>
      </div>
    </div>
  );
}
