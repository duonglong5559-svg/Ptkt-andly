import { Drawing } from "@/hooks/useDrawingTools";
import { formatPrice } from "@/data/tradingData";

interface DrawingLayerProps {
  drawings: Drawing[];
  activeDrawing: Drawing | null;
  chartWidth: number;
  chartHeight: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  yFn: (price: number) => number;
  onRemoveDrawing: (id: string) => void;
}

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

function RenderDrawing({
  d,
  chartWidth,
  padLeft,
  padRight,
  padTop,
  chartHeight,
  yFn,
  onRemove,
}: {
  d: Drawing;
  chartWidth: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  chartHeight: number;
  yFn: (price: number) => number;
  onRemove?: () => void;
}) {
  if (d.points.length < 1) return null;
  const p1 = d.points[0];
  const p2 = d.points.length > 1 ? d.points[1] : p1;

  switch (d.tool) {
    case "trendline": {
      return (
        <g className="cursor-pointer group">
          {/* Hit area */}
          <line
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="transparent" strokeWidth={8}
            onDoubleClick={onRemove}
          />
          <line
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={d.color} strokeWidth={d.lineWidth} strokeLinecap="round"
          />
          <circle cx={p1.x} cy={p1.y} r={3} fill={d.color} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          <circle cx={p2.x} cy={p2.y} r={3} fill={d.color} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </g>
      );
    }

    case "ray": {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const extendX = p1.x + (dx / len) * chartWidth * 2;
      const extendY = p1.y + (dy / len) * chartWidth * 2;
      return (
        <g className="cursor-pointer group">
          <line x1={p1.x} y1={p1.y} x2={extendX} y2={extendY} stroke="transparent" strokeWidth={8} onDoubleClick={onRemove} />
          <line x1={p1.x} y1={p1.y} x2={extendX} y2={extendY} stroke={d.color} strokeWidth={d.lineWidth} strokeDasharray="4,2" />
          <circle cx={p1.x} cy={p1.y} r={3} fill={d.color} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </g>
      );
    }

    case "horizontal": {
      const hy = p1.y;
      return (
        <g className="cursor-pointer group">
          <line x1={padLeft} y1={hy} x2={chartWidth - padRight} y2={hy} stroke="transparent" strokeWidth={8} onDoubleClick={onRemove} />
          <line x1={padLeft} y1={hy} x2={chartWidth - padRight} y2={hy} stroke={d.color} strokeWidth={d.lineWidth} strokeDasharray="6,3" />
          <rect x={chartWidth - padRight - 60} y={hy - 8} width={56} height={16} fill={d.color} rx={3} opacity={0.2} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          <text x={chartWidth - padRight - 32} y={hy + 4} fill={d.color} fontSize={8} textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
            {formatPrice(p1.price)}
          </text>
        </g>
      );
    }

    case "rectangle": {
      const rx = Math.min(p1.x, p2.x);
      const ry = Math.min(p1.y, p2.y);
      const rw = Math.abs(p2.x - p1.x);
      const rh = Math.abs(p2.y - p1.y);
      return (
        <g className="cursor-pointer group">
          <rect x={rx} y={ry} width={rw} height={rh} fill="transparent" stroke="transparent" strokeWidth={8} onDoubleClick={onRemove} />
          <rect x={rx} y={ry} width={rw} height={rh} fill={d.color} fillOpacity={0.06} stroke={d.color} strokeWidth={d.lineWidth} rx={2} />
        </g>
      );
    }

    case "fibonacci": {
      const highPrice = Math.max(p1.price, p2.price);
      const lowPrice = Math.min(p1.price, p2.price);
      const range = highPrice - lowPrice;
      if (range === 0) return null;

      return (
        <g className="cursor-pointer group">
          <rect x={padLeft} y={Math.min(p1.y, p2.y)} width={chartWidth - padLeft - padRight} height={Math.abs(p2.y - p1.y)} fill="transparent" onDoubleClick={onRemove} />
          {FIB_LEVELS.map((level) => {
            const price = highPrice - range * level;
            const fy = yFn(price);
            const alpha = level === 0 || level === 1 ? 0.6 : level === 0.5 || level === 0.618 ? 0.5 : 0.3;
            return (
              <g key={level}>
                <line x1={padLeft} y1={fy} x2={chartWidth - padRight} y2={fy} stroke={d.color} strokeWidth={0.8} strokeDasharray="4,3" opacity={alpha} />
                <rect x={padLeft} y={fy} width={chartWidth - padLeft - padRight} height={level < 1 ? yFn(highPrice - range * FIB_LEVELS[FIB_LEVELS.indexOf(level) + 1]) - fy : 0} fill={d.color} fillOpacity={0.03} />
                <text x={padLeft + 4} y={fy - 3} fill={d.color} fontSize={8} opacity={0.8}>
                  {(level * 100).toFixed(1)}% — {formatPrice(price)}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    default:
      return null;
  }
}

export default function DrawingLayer({
  drawings,
  activeDrawing,
  chartWidth,
  chartHeight,
  padLeft,
  padRight,
  padTop,
  yFn,
  onRemoveDrawing,
}: DrawingLayerProps) {
  const all = activeDrawing ? [...drawings, activeDrawing] : drawings;

  return (
    <g>
      {all.map((d) => (
        <RenderDrawing
          key={d.id}
          d={d}
          chartWidth={chartWidth}
          padLeft={padLeft}
          padRight={padRight}
          padTop={padTop}
          chartHeight={chartHeight}
          yFn={yFn}
          onRemove={d.completed ? () => onRemoveDrawing(d.id) : undefined}
        />
      ))}
    </g>
  );
}
