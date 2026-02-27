/**
 * Panel hiển thị thanh khoản từ Liquiheart Map / Coinglass API
 */

import { useQuery } from "@tanstack/react-query";
import { Droplets, TrendingUp, TrendingDown } from "lucide-react";
import { fetchLiquidityMap, hasLiquidityApiKey } from "@/services/liquidityApi";

interface LiquidityPanelProps {
  symbol: string;
}

export default function LiquidityPanel({ symbol }: LiquidityPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["liquidity", symbol],
    queryFn: () => fetchLiquidityMap(symbol),
    staleTime: 60000,
  });

  if (isLoading || !data) {
    return (
      <div className="bg-secondary/30 rounded-lg p-3 animate-pulse">
        <div className="h-16 bg-secondary/50 rounded" />
      </div>
    );
  }

  const longTotal = data.totalLongLiquidation;
  const shortTotal = data.totalShortLiquidation;
  const total = longTotal + shortTotal;
  const longPct = total > 0 ? (longTotal / total) * 100 : 50;

  return (
    <div className="bg-secondary/30 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-trading-gold mb-2 flex items-center gap-2">
        <Droplets className="w-4 h-4" />
        Thanh khoản (Liquiheart Map)
        {!hasLiquidityApiKey() && (
          <span className="text-[10px] text-muted-foreground font-normal">(Demo)</span>
        )}
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            Long liquidation
          </span>
          <span className="text-white">${(longTotal / 1e6).toFixed(1)}M</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            Short liquidation
          </span>
          <span className="text-white">${(shortTotal / 1e6).toFixed(1)}M</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-trading-green transition-all"
            style={{ width: `${longPct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Các cluster thanh khoản giúp xác định vùng giá quan trọng
        </p>
      </div>
    </div>
  );
}
