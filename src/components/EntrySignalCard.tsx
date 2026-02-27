import { EntrySignal, AIAnalysisScore } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";
import { Target, ShieldAlert, TrendingUp, TrendingDown, Brain, Zap } from "lucide-react";

interface EntrySignalCardProps {
  signal: EntrySignal;
  aiScore?: AIAnalysisScore;
  timeframe?: string;
  pairName?: string;
}

export default function EntrySignalCard({ signal, aiScore, timeframe, pairName }: EntrySignalCardProps) {
  if (signal.confidence === 0) return null;

  const isLong = signal.type === "Long";
  const isShort = signal.type === "Short";
  const color = isLong ? "green" : isShort ? "red" : "yellow";
  const Icon = isLong ? TrendingUp : isShort ? TrendingDown : Target;

  return (
    <div className={`mx-3 mt-2 mb-1 rounded-lg border ${isLong ? "border-green-500/20 bg-green-500/5" : isShort ? "border-red-500/20 bg-red-500/5" : "border-yellow-500/20 bg-yellow-500/5"} p-2.5 animate-fadeInUp`}>

      {/* Header: Signal + AI */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className={`p-1 rounded-md ${isLong ? "bg-green-500/20" : isShort ? "bg-red-500/20" : "bg-yellow-500/20"}`}>
            <Icon className={`w-3.5 h-3.5 text-${color}-400`} />
          </div>
          <div>
            <div className={`font-bold text-xs text-${color}-400`}>{signal.type}</div>
            <div className="text-[8px] text-muted-foreground">
              {pairName} · {timeframe} · {signal.confidence}% tin cậy
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {aiScore && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/15 text-[8px] text-purple-300 font-bold">
              <Brain className="w-2.5 h-2.5" /> {aiScore.overall}
            </div>
          )}
          <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${isLong ? "bg-green-500/15 text-green-400" : isShort ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>
            RR {signal.rr}
          </div>
        </div>
      </div>

      {/* AI reasoning */}
      {aiScore && (
        <div className="flex items-start gap-1 mb-2 px-1.5 py-1 rounded bg-black/20 text-[8px] text-muted-foreground">
          <Zap className="w-2.5 h-2.5 text-purple-400 mt-0.5 flex-shrink-0" />
          <span>{aiScore.verdict} — {signal.reason}</span>
        </div>
      )}

      {/* Price grid: Entry + SL + TP Scalp + TP Swing */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-black/20 rounded-md px-2 py-1.5">
          <div className="text-[7px] text-muted-foreground">Entry</div>
          <div className="text-[11px] font-bold text-white">${formatPrice(signal.entry)}</div>
        </div>
        <div className="bg-black/20 rounded-md px-2 py-1.5">
          <div className="text-[7px] text-muted-foreground flex items-center gap-0.5">
            <ShieldAlert className="w-2 h-2" /> Stop Loss
          </div>
          <div className="text-[11px] font-bold text-red-400">${formatPrice(signal.sl)}</div>
        </div>
        <div className="bg-black/20 rounded-md px-2 py-1.5">
          <div className="text-[7px] text-muted-foreground">TP1 Scalp</div>
          <div className="text-[11px] font-bold text-green-400">${formatPrice(signal.tp1)}</div>
        </div>
        <div className="bg-black/20 rounded-md px-2 py-1.5">
          <div className="text-[7px] text-muted-foreground">TP2 Swing</div>
          <div className="text-[11px] font-bold text-green-400">${formatPrice(signal.tp2)}</div>
        </div>
      </div>
    </div>
  );
}
