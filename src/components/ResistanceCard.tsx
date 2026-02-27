import { SRLevel } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";
import { Eye, Copy, Shield } from "lucide-react";

interface ResistanceCardProps {
  level: SRLevel;
  index: number;
}

export default function ResistanceCard({ level, index }: ResistanceCardProps) {
  const isR = level.type === "resistance";
  const dotColor = isR ? "bg-red-500" : "bg-green-500";
  const labelColor = isR ? "text-red-400" : "text-green-400";
  const strengthColor =
    level.strength === "Rất mạnh" ? "text-red-400" : level.strength === "Mạnh" ? "text-orange-400" : "text-yellow-400";

  return (
    <div
      className={`border-b border-trading-borderColor px-3 py-3 hover:bg-secondary/20 transition-all animate-fadeInUp`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${dotColor} animate-breathe`} />
        <span className={`font-bold text-xs ${labelColor}`}>
          {isR ? "KHÁNG CỰ" : "HỖ TRỢ"} @ ${formatPrice(level.price)}
        </span>
        {level.isAuto && (
          <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            AUTO
          </span>
        )}
      </div>

      {/* ATR distance */}
      <div className="flex items-center gap-1 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[10px] text-muted-foreground">
          Giá đang test {isR ? "kháng cự" : "hỗ trợ"}
        </span>
      </div>

      {/* Strength */}
      <div className="flex items-center gap-1 mb-1.5">
        <span className={`font-bold text-[10px] ${strengthColor}`}>{level.strength}</span>
        <span className="text-[10px] text-muted-foreground">
          · {level.confidence}% tin cậy · {level.testCount} lần test · RR {level.riskReward}
        </span>
      </div>

      {/* Action */}
      <div className="flex items-center gap-1 mb-1.5">
        <Eye className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{level.action}</span>
      </div>

      {/* Pattern */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px] text-white">
          <Shield className="w-2.5 h-2.5" />
          Mô hình: {level.pattern}
        </span>
      </div>

      {/* Prices */}
      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
        <span>
          Scalp TP: ${formatPrice(level.scalpTP)} | Swing TP: ${formatPrice(level.swingTP)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-muted-foreground">
          Stop Loss: ${formatPrice(level.stopLoss)}{" "}
          <span className={isR ? "text-red-400" : "text-green-400"}>
            (đã điều chỉnh {level.slPercent})
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <button className="p-0.5 hover:bg-secondary rounded transition-colors">
            <Eye className="w-3 h-3 text-muted-foreground" />
          </button>
          <button className="p-0.5 hover:bg-secondary rounded transition-colors">
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
