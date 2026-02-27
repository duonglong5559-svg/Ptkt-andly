import { useMemo } from "react";
import { CandleData } from "@/lib/binanceApi";
import { formatPrice } from "@/data/tradingData";
import { Flame, Info } from "lucide-react";

interface LiquidationMapProps {
  candles: CandleData[];
  currentPrice: number;
  atr: number;
}

interface LiqLevel {
  price: number;
  intensity: number;
  leverage: string;
  type: "long" | "short";
}

export default function LiquidationMap({ candles, currentPrice, atr }: LiquidationMapProps) {
  const levels = useMemo((): LqLevel[] => {
    if (candles.length < 20 || atr === 0) return [];
    const result: LqLevel[] = [];

    const leverages = [5, 10, 20, 25, 50, 100];
    for (const lv of leverages) {
      const liqLong = currentPrice * (1 - 0.9 / lv);
      const liqShort = currentPrice * (1 + 0.9 / lv);

      const recentVolume = candles.slice(-10).reduce((s, c) => s + c.volume, 0) / 10;
      const intensity = Math.min(100, (recentVolume / (candles.slice(-30).reduce((s, c) => s + c.volume, 0) / 30)) * 50 + (lv > 20 ? 20 : 0));

      result.push({ price: liqLong, intensity, leverage: `${lv}x`, type: "long" });
      result.push({ price: liqShort, intensity, leverage: `${lv}x`, type: "short" });
    }

    return result.sort((a, b) => b.price - a.price);
  }, [candles, currentPrice, atr]);

  const maxIntensity = Math.max(...levels.map((l) => l.intensity), 1);

  return (
    <div className="px-3 py-2 space-y-2 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] font-bold text-white">Liquidation Heatmap</span>
        </div>
        <div className="flex items-center gap-0.5 text-[7px] text-muted-foreground">
          <Info className="w-2.5 h-2.5" /> Ước tính dựa trên leverage phổ biến
        </div>
      </div>

      <div className="bg-secondary/20 rounded-lg p-2 space-y-0.5">
        {levels.map((l, i) => {
          const barWidth = (l.intensity / maxIntensity) * 100;
          const isAbove = l.price > currentPrice;
          const isCurrent = Math.abs(l.price - currentPrice) / currentPrice < 0.001;

          return (
            <div key={i} className="flex items-center gap-1.5 h-5">
              <span className="text-[7px] text-muted-foreground w-8 text-right">{l.leverage}</span>
              <span className={`text-[7px] w-16 text-right ${l.type === "long" ? "text-green-400" : "text-red-400"}`}>
                {formatPrice(l.price)}
              </span>
              <div className="flex-1 h-3 bg-gray-800/50 rounded-sm overflow-hidden relative">
                <div
                  className={`h-full rounded-sm transition-all duration-500 ${
                    l.type === "long"
                      ? "bg-gradient-to-r from-green-600/60 to-green-400/40"
                      : "bg-gradient-to-r from-red-400/40 to-red-600/60"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className={`text-[7px] w-6 ${l.type === "long" ? "text-green-400" : "text-red-400"}`}>
                {l.type === "long" ? "L" : "S"}
              </span>
            </div>
          );
        })}

        {/* Current price marker */}
        <div className="flex items-center gap-1.5 h-5 mt-1 bg-blue-500/10 rounded px-1">
          <span className="text-[7px] text-blue-400 w-8 text-right">NOW</span>
          <span className="text-[8px] text-blue-400 font-bold w-16 text-right">${formatPrice(currentPrice)}</span>
          <div className="flex-1 h-0.5 bg-blue-400/50 rounded" />
        </div>
      </div>

      <div className="text-[7px] text-muted-foreground/60 leading-relaxed">
        💡 Khu vực có thanh khoản cao (leverage 20x-100x) thường là "nam châm" hút giá. Giá có xu hướng chạy về vùng có nhiều liquidation trước khi đảo chiều.
      </div>
    </div>
  );
}

type LqLevel = LiqLevel;
