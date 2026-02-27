import { useState, useCallback } from "react";

export type DrawingToolType =
  | "cursor"
  | "crosshair"
  | "trendline"
  | "horizontal"
  | "ray"
  | "rectangle"
  | "fibonacci";

export interface DrawingPoint {
  x: number;
  y: number;
  price: number;
  index: number;
}

export interface Drawing {
  id: string;
  tool: DrawingToolType;
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  completed: boolean;
}

let drawingIdCounter = 0;

export function useDrawingTools() {
  const [activeTool, setActiveTool] = useState<DrawingToolType>("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeDrawing, setActiveDrawing] = useState<Drawing | null>(null);
  const [selectedColor, setSelectedColor] = useState("#f59e0b");

  const startDrawing = useCallback((point: DrawingPoint) => {
    if (activeTool === "cursor" || activeTool === "crosshair") return;

    const newDrawing: Drawing = {
      id: `draw-${++drawingIdCounter}`,
      tool: activeTool,
      points: [point],
      color: selectedColor,
      lineWidth: activeTool === "horizontal" ? 1.5 : 1.2,
      completed: false,
    };

    if (activeTool === "horizontal") {
      newDrawing.points.push({ ...point });
      newDrawing.completed = true;
      setDrawings((prev) => [...prev, newDrawing]);
      return;
    }

    setActiveDrawing(newDrawing);
  }, [activeTool, selectedColor]);

  const updateDrawing = useCallback((point: DrawingPoint) => {
    if (!activeDrawing) return;
    setActiveDrawing((prev) => {
      if (!prev) return null;
      const pts = [...prev.points];
      if (pts.length === 1) {
        pts.push(point);
      } else {
        pts[pts.length - 1] = point;
      }
      return { ...prev, points: pts };
    });
  }, [activeDrawing]);

  const finishDrawing = useCallback(() => {
    if (!activeDrawing) return;
    if (activeDrawing.points.length < 2) {
      setActiveDrawing(null);
      return;
    }
    const finished = { ...activeDrawing, completed: true };
    setDrawings((prev) => [...prev, finished]);
    setActiveDrawing(null);
  }, [activeDrawing]);

  const removeDrawing = useCallback((id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clearAllDrawings = useCallback(() => {
    setDrawings([]);
    setActiveDrawing(null);
  }, []);

  const undoLast = useCallback(() => {
    setDrawings((prev) => prev.slice(0, -1));
  }, []);

  return {
    activeTool,
    setActiveTool,
    drawings,
    activeDrawing,
    selectedColor,
    setSelectedColor,
    startDrawing,
    updateDrawing,
    finishDrawing,
    removeDrawing,
    clearAllDrawings,
    undoLast,
  };
}
