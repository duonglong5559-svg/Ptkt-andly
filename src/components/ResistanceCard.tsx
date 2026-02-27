import { ResistanceLevel } from "@/data/tradingData";
import { Eye, Copy, Shield, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { appendTrainingExample } from "@/lib/dataset/trainingDataset";

interface ResistanceCardProps {
  level: ResistanceLevel;
  meta?: {
    symbol: string;
    timeframe: string;
    source?: string;
  };
}

export default function ResistanceCard({ level, meta }: ResistanceCardProps) {
  const isResistance = level.type === "resistance";
  const dotColor = isResistance ? "bg-red-500" : "bg-green-500";
  const labelColor = isResistance ? "text-red-400" : "text-green-400";
  const strengthBg =
    level.strength === "Rất mạnh"
      ? "text-red-400"
      : level.strength === "Mạnh"
        ? "text-orange-400"
        : "text-yellow-400";

  const saveForTraining = async () => {
    try {
      if (!meta) {
        toast.error("Thiếu metadata (symbol/timeframe) để lưu dataset.");
        return;
      }
      appendTrainingExample({
        createdAt: new Date().toISOString(),
        symbol: meta.symbol,
        timeframe: meta.timeframe,
        source: meta.source,
        level,
      });
      await navigator.clipboard.writeText(JSON.stringify({ symbol: meta.symbol, timeframe: meta.timeframe, level }, null, 2));
      toast.success("Đã lưu vào dataset + copy JSON vào clipboard");
    } catch {
      toast.error("Không lưu/copy được (trình duyệt chặn clipboard).");
    }
  };

  return (
    <div className="border-b border-trading-borderColor px-4 py-3 hover:bg-secondary/20 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-pulse_glow`} />
        <span className={`font-bold text-sm ${labelColor}`}>
          {level.label} @ ${level.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
        {level.isAuto && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            AUTO
          </span>
        )}
      </div>

      {/* Sub-header info */}
      <div className="flex items-center gap-1 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-muted-foreground">
          Giá đang test {isResistance ? "kháng cự" : "hỗ trợ"} (dưới{" "}
          {level.confidence > 85 ? "0.6" : "0.9"} ATR)
        </span>
      </div>

      {/* Strength info */}
      <div className="flex items-center gap-1 mb-2">
        <span className={`font-bold text-xs ${strengthBg}`}>{level.strength}</span>
        <span className="text-xs text-muted-foreground">
          · {level.confidence}% tin cậy · {level.testCount} lần test · RR {level.riskReward}
        </span>
      </div>

      {/* Action */}
      <div className="flex items-center gap-1 mb-2">
        <Eye className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{level.action}</span>
      </div>

      {/* Pattern badge */}
      <div className="mb-2.5">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs text-white">
          <Shield className="w-3 h-3" />
          Mô hình hỗ trợ: {level.pattern}
        </span>
      </div>

      {/* Price details */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
        <span>
          Scalp: ${level.scalpPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} | Swing: $
          {level.swingPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          Stop Loss: ${level.stopLoss.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
          <span className={isResistance ? "text-red-400" : "text-green-400"}>
            (đã điều chỉnh {level.stopLossChange})
          </span>
        </span>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-secondary rounded transition-colors">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={saveForTraining} className="p-1 hover:bg-secondary rounded transition-colors">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
