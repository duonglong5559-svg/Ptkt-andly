import { EntrySignal } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";
import { Target, ShieldAlert, TrendingUp, TrendingDown } from "lucide-react";

interface EntrySignalCardProps {
  signal: EntrySignal;
}

export default function EntrySignalCard({ signal }: EntrySignalCardProps) {
  if (signal.confidence === 0) return null;

  const isLong = signal.type === "Long";
  const isShort = signal.type === "Short";
  const borderColor = isLong ? "border-green-500/30" : isShort ? "border-red-500/30" : "border-yellow-500/30";
  const bgColor = isLong ? "bg-green-500/5" : isShort ? "bg-red-500/5" : "bg-yellow-500/5";
  const textColor = isLong ? "text-green-400" : isShort ? "text-red-400" : "text-yellow-400";
  const Icon = isLong ? TrendingUp : isShort ? TrendingDown : Target;

  return (
    <div className={`mx-3 my-3 rounded-xl border ${borderColor} ${bgColor} p-3 animate-fadeInUp`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isLong ? "bg-green-500/20" : isShort ? "bg-red-500/20" : "bg-yellow-500/20"}`}>
            <Icon className={`w-4 h-4 ${textColor}`} />
          </div>
          <div>
            <div className={`font-bold text-sm ${textColor}`}>Tín hiệu {signal.type}</div>
            <div className="text-[10px] text-muted-foreground">Tin cậy: {signal.confidence}%</div>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isLong ? "bg-green-500/20 text-green-400" : isShort ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
          RR {signal.rr}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isLong ? "bg-gradient-to-r from-green-600 to-green-400" : isShort ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-gradient-to-r from-yellow-600 to-yellow-400"}`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-[9px] text-muted-foreground mb-0.5">Entry</div>
          <div className="text-xs font-bold text-white">${formatPrice(signal.entry)}</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-[9px] text-muted-foreground flex items-center gap-1 mb-0.5">
            <ShieldAlert className="w-2.5 h-2.5" /> Stop Loss
          </div>
          <div className="text-xs font-bold text-red-400">${formatPrice(signal.sl)}</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-[9px] text-muted-foreground mb-0.5">TP1 (Scalp)</div>
          <div className="text-xs font-bold text-green-400">${formatPrice(signal.tp1)}</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-[9px] text-muted-foreground mb-0.5">TP2 (Swing)</div>
          <div className="text-xs font-bold text-green-400">${formatPrice(signal.tp2)}</div>
        </div>
      </div>

      {/* Reason */}
      <div className="text-[9px] text-muted-foreground leading-relaxed">
        <span className="text-white/70 font-medium">Lý do: </span>{signal.reason}
      </div>
    </div>
  );
}
