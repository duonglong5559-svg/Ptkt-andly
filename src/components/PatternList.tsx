import { CandlePattern } from "@/lib/technicalAnalysis";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PatternListProps {
  patterns: CandlePattern[];
}

export default function PatternList({ patterns }: PatternListProps) {
  const recent = patterns.slice(-10).reverse();

  if (recent.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">Chưa phát hiện mô hình nến nào</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-trading-borderColor">
      {recent.map((p, i) => {
        const Icon = p.direction === "bullish" ? TrendingUp : p.direction === "bearish" ? TrendingDown : Minus;
        const color = p.direction === "bullish" ? "text-green-400" : p.direction === "bearish" ? "text-red-400" : "text-yellow-400";
        const bg = p.direction === "bullish" ? "bg-green-500/10" : p.direction === "bearish" ? "bg-red-500/10" : "bg-yellow-500/10";

        return (
          <div
            key={`${p.type}-${p.index}-${i}`}
            className="px-3 py-2.5 flex items-start gap-2 hover:bg-secondary/20 transition-all animate-fadeInUp"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`p-1.5 rounded-md ${bg} mt-0.5`}>
              <Icon className={`w-3 h-3 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-xs font-semibold ${color}`}>{p.type}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: p.strength }).map((_, s) => (
                    <span key={s} className={`w-1 h-1 rounded-full ${p.direction === "bullish" ? "bg-green-400" : p.direction === "bearish" ? "bg-red-400" : "bg-yellow-400"}`} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">{p.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
