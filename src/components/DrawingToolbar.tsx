import { DrawingToolType } from "@/hooks/useDrawingTools";
import {
  MousePointer2,
  Crosshair,
  TrendingUp,
  Minus,
  MoveRight,
  Square,
  GitBranch,
  Trash2,
  Undo2,
  Palette,
} from "lucide-react";

interface DrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onClearAll: () => void;
  onUndo: () => void;
  drawingCount: number;
}

const TOOLS: { id: DrawingToolType; icon: any; label: string }[] = [
  { id: "cursor", icon: MousePointer2, label: "Con trỏ" },
  { id: "crosshair", icon: Crosshair, label: "Crosshair" },
  { id: "trendline", icon: TrendingUp, label: "Trend Line" },
  { id: "horizontal", icon: Minus, label: "Đường ngang" },
  { id: "ray", icon: MoveRight, label: "Tia" },
  { id: "rectangle", icon: Square, label: "Hình chữ nhật" },
  { id: "fibonacci", icon: GitBranch, label: "Fibonacci" },
];

const COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#ffffff"];

export default function DrawingToolbar({
  activeTool,
  onSelectTool,
  selectedColor,
  onSelectColor,
  onClearAll,
  onUndo,
  drawingCount,
}: DrawingToolbarProps) {
  return (
    <div className="absolute left-1 top-12 z-20 flex flex-col gap-0.5 bg-card/95 border border-trading-borderColor rounded-lg p-1 shadow-xl shadow-black/30 backdrop-blur-sm">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={t.label}
            className={`p-1.5 rounded-md transition-all ${
              isActive
                ? "bg-trading-gold/20 text-trading-gold shadow-inner"
                : "text-muted-foreground hover:text-white hover:bg-secondary/50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}

      <div className="border-t border-trading-borderColor my-0.5" />

      {/* Color picker */}
      <div className="flex flex-col gap-0.5 px-0.5">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onSelectColor(c)}
            className={`w-4 h-4 rounded-full border-2 transition-all mx-auto ${
              selectedColor === c ? "border-white scale-110" : "border-transparent hover:border-gray-500"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="border-t border-trading-borderColor my-0.5" />

      {/* Undo */}
      <button
        onClick={onUndo}
        title="Hoàn tác"
        disabled={drawingCount === 0}
        className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-secondary/50 disabled:opacity-30 transition-all"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </button>

      {/* Clear all */}
      <button
        onClick={onClearAll}
        title="Xóa tất cả"
        disabled={drawingCount === 0}
        className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
