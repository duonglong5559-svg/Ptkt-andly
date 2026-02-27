import { useMemo } from "react";
import { TradingPair, LiquidityData } from "@/data/tradingData";
import { Droplets, TrendingUp, TrendingDown } from "lucide-react";

interface LiquidityHeatmapProps {
  pair: TradingPair;
  liquidityData: LiquidityData;
}

export default function LiquidityHeatmap({ pair, liquidityData }: LiquidityHeatmapProps) {
  const { levels, maxVolume, bidTotal, askTotal, imbalance } = liquidityData;

  const sortedLevels = useMemo(() =>
    [...levels].sort((a, b) => b.price - a.price),
    [levels]
  );

  const bidCluster = useMemo(() => {
    const bids = levels.filter((l) => l.type === "bid").sort((a, b) => b.volume - a.volume);
    return bids.slice(0, 3);
  }, [levels]);

  const askCluster = useMemo(() => {
    const asks = levels.filter((l) => l.type === "ask").sort((a, b) => b.volume - a.volume);
    return asks.slice(0, 3);
  }, [levels]);

  const fmt = (v: number) => v.toFixed(pair.decimals);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Droplets className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold text-white">Liquidity Heatmap</span>
          <div className="text-[10px] text-muted-foreground">Bản đồ thanh khoản theo giá · {pair.symbol}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <div className="text-trading-green text-sm font-bold">{(bidTotal / 1000).toFixed(1)}K</div>
          <div className="text-[10px] text-muted-foreground">Bid Volume</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <div className="text-trading-red text-sm font-bold">{(askTotal / 1000).toFixed(1)}K</div>
          <div className="text-[10px] text-muted-foreground">Ask Volume</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <div className={`text-sm font-bold ${imbalance > 0 ? "text-trading-green" : "text-trading-red"}`}>
            {imbalance > 0 ? "+" : ""}{imbalance}%
          </div>
          <div className="text-[10px] text-muted-foreground">Imbalance</div>
        </div>
      </div>

      <div className="bg-secondary/20 rounded-lg border border-trading-borderColor overflow-hidden mb-3">
        <div className="px-3 py-2 border-b border-trading-borderColor flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-medium">GIÁ</span>
          <span className="text-[10px] text-muted-foreground font-medium">VOLUME</span>
        </div>

        <div className="max-h-[280px] overflow-y-auto">
          {sortedLevels.map((level, i) => {
            const pct = (level.volume / maxVolume) * 100;
            const isBid = level.type === "bid";
            const isCurrentPrice = Math.abs(level.price - pair.currentPrice) < (pair.currentPrice * 0.001);
            const heatIntensity = level.strength;

            const heatColor = isBid
              ? `rgba(34, 197, 94, ${0.1 + heatIntensity * 0.5})`
              : `rgba(239, 68, 68, ${0.1 + heatIntensity * 0.5})`;

            return (
              <div
                key={i}
                className={`relative flex items-center justify-between px-3 py-1.5 ${
                  isCurrentPrice ? "bg-blue-500/20 border-y border-blue-500/30" : ""
                }`}
              >
                <div
                  className="absolute inset-y-0 right-0 opacity-60"
                  style={{
                    width: `${pct}%`,
                    background: heatColor,
                  }}
                />
                <div className="relative flex items-center gap-1.5">
                  {isCurrentPrice && <span className="text-[8px] text-blue-400 font-bold">▶</span>}
                  <span className={`text-xs font-mono ${
                    isCurrentPrice ? "text-blue-400 font-bold" : isBid ? "text-green-400/80" : "text-red-400/80"
                  }`}>
                    {fmt(level.price)}
                  </span>
                </div>
                <div className="relative flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{
                    background: isBid ? "#22c55e" : "#ef4444",
                    opacity: 0.3 + heatIntensity * 0.7,
                    boxShadow: heatIntensity > 0.7 ? `0 0 6px ${isBid ? "#22c55e" : "#ef4444"}` : "none",
                  }} />
                  <span className="text-[11px] text-muted-foreground font-mono">{level.volume}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-secondary/30 rounded-lg p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <TrendingUp className="w-3 h-3 text-trading-green" />
            <span className="text-[10px] font-semibold text-trading-green">Bid Clusters</span>
          </div>
          <div className="space-y-1">
            {bidCluster.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-green-400/80 font-mono">{fmt(l.price)}</span>
                <span className="text-muted-foreground">{l.volume}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <TrendingDown className="w-3 h-3 text-trading-red" />
            <span className="text-[10px] font-semibold text-trading-red">Ask Clusters</span>
          </div>
          <div className="space-y-1">
            {askCluster.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-red-400/80 font-mono">{fmt(l.price)}</span>
                <span className="text-muted-foreground">{l.volume}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 p-2 bg-secondary/20 rounded-lg border border-trading-borderColor">
        <div className="text-[10px] text-muted-foreground">
          <span className="text-trading-gold font-semibold">💡 Gợi ý thanh khoản: </span>
          {imbalance > 10
            ? "Bid volume áp đảo — Lực mua mạnh, giá có xu hướng tăng. Tìm entry tại bid cluster."
            : imbalance < -10
              ? "Ask volume áp đảo — Lực bán mạnh, giá có xu hướng giảm. Cẩn thận vùng ask cluster."
              : "Thanh khoản cân bằng — Chờ breakout khỏi vùng tích lũy."}
        </div>
      </div>
    </div>
  );
}
