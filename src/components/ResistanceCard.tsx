import { ResistanceLevel } from "@/data/tradingData";
import { Eye, Copy, Shield } from "lucide-react";

interface ResistanceCardProps {
  level: ResistanceLevel;
}

export default function ResistanceCard({ level }: ResistanceCardProps) {
  const isResistance = level.type === "resistance";
  const dotColor = isResistance ? "bg-red-500" : "bg-green-500";
  const labelColor = isResistance ? "text-red-400" : "text-green-400";
  const strengthBg =
    level.strength === "Rất mạnh"
      ? "text-emerald-300"
      : level.strength === "Mạnh"
        ? "text-amber-300"
        : "text-yellow-400";

  return (
    <div className="border-b border-trading-borderColor px-4 py-3 hover:bg-secondary/20 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-pulse_glow`} />
        <span className={`font-bold text-sm ${labelColor}`}>
          {level.label} @ ${level.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-trading-borderColor">
          {level.source}
        </span>
        {level.isAuto && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            AUTO
          </span>
        )}
        {level.highProbability && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            HIGH-PROB
          </span>
        )}
      </div>

      {/* Sub-header info */}
      <div className="flex items-center gap-1 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-muted-foreground">
          Giá đang test vùng {isResistance ? "kháng cự" : "hỗ trợ"} cứng theo pivot/trendline
        </span>
      </div>

      {/* Strength info */}
      <div className="flex items-center gap-1 mb-2">
        <span className={`font-bold text-xs ${strengthBg}`}>{level.strength}</span>
        <span className="text-xs text-muted-foreground">
          · {level.confidence}% tin cậy · {level.testCount} lần test · RR {level.riskReward} (
          {level.riskRewardRatio.toFixed(1)})
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
          <button className="p-1 hover:bg-secondary rounded transition-colors">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
