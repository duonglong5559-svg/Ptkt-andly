import { TradingPair } from "@/data/tradingData";
import { ChevronDown, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface TradingHeaderProps {
  pairs: TradingPair[];
  selectedPair: TradingPair;
  onSelectPair: (pair: TradingPair) => void;
  showPairSelector: boolean;
  onTogglePairSelector: () => void;
}

export default function TradingHeader({
  pairs,
  selectedPair,
  onSelectPair,
  showPairSelector,
  onTogglePairSelector,
}: TradingHeaderProps) {
  const signalColor =
    selectedPair.signal === "Short"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : selectedPair.signal === "Long"
        ? "bg-green-500/20 text-green-400 border-green-500/30"
        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  const SignalIcon =
    selectedPair.signal === "Short"
      ? TrendingDown
      : selectedPair.signal === "Long"
        ? TrendingUp
        : Minus;

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-trading-borderColor">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
            SC
          </div>
          <span className="font-semibold text-sm text-white">Crypto & Forex Trading</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${signalColor}`}
          >
            Lệnh Chờ {selectedPair.signal}
            <span className="w-2 h-2 rounded-full bg-current animate-pulse_glow" />
          </button>

          <button
            onClick={onTogglePairSelector}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary border border-trading-borderColor text-xs font-medium text-white hover:bg-secondary/80 transition-all"
          >
            {selectedPair.symbol}
            {selectedPair.category === "forex" && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">FX</span>
            )}
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showPairSelector && (
        <div className="absolute top-full right-4 z-50 mt-1 w-64 bg-card border border-trading-borderColor rounded-lg shadow-2xl overflow-hidden">
          {pairs.map((pair) => (
            <button
              key={pair.symbol}
              onClick={() => {
                onSelectPair(pair);
                onTogglePairSelector();
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary/50 transition-colors ${
                pair.symbol === selectedPair.symbol ? "bg-secondary/30 text-green-400" : "text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{pair.symbol}</span>
                {pair.category === "forex" && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">FOREX</span>
                )}
              </div>
              <span className="text-muted-foreground text-xs">{pair.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
