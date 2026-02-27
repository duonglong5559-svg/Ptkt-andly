/**
 * Wrapper cho biểu đồ - cho phép kéo dãn resize chiều cao
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { GripHorizontal } from "lucide-react";

interface ResizableChartProps {
  children: React.ReactNode;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
}

export default function ResizableChart({
  children,
  defaultHeight = 360,
  minHeight = 200,
  maxHeight = 600,
}: ResizableChartProps) {
  const [height, setHeight] = useState(defaultHeight);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startY.current = e.clientY;
      startH.current = height;
    },
    [height]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      startY.current = e.touches[0].clientY;
      startH.current = height;
    },
    [height]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientY = "touches" in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const delta = startY.current - clientY;
      const newH = Math.min(maxHeight, Math.max(minHeight, startH.current + delta));
      setHeight(newH);
    };
    const onEnd = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove as (e: TouchEvent) => void, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove as (e: TouchEvent) => void);
      window.removeEventListener("touchend", onEnd);
    };
  }, [minHeight, maxHeight]);

  return (
    <div className="relative">
      <div style={{ height: `${height}px` }} className="w-full overflow-hidden">
        {children}
      </div>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-center bg-trading-darkBg/80 hover:bg-secondary/50 cursor-ns-resize border-t border-trading-borderColor transition-colors touch-none"
        aria-label="Kéo để thay đổi chiều cao biểu đồ"
      >
        <GripHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
