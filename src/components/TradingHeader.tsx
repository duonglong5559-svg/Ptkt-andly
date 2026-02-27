import { TradingPair, TradingSignal, getMarketLabel } from "@/data/tradingData";
import { ChevronDown } from "lucide-react";

interface TradingHeaderProps {
  pairs: TradingPair[];
  selectedPair: TradingPair;
  activeSignal: TradingSignal;
  onSelectPair: (pair: TradingPair) => void;
  showPairSelector: boolean;
  onTogglePairSelector: () => void;
}

export default function TradingHeader({
  pairs,
  selectedPair,
  activeSignal,
  onSelectPair,
  showPairSelector,
  onTogglePairSelector,
}: TradingHeaderProps) {
  const signalColor =
    activeSignal === "Short"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : activeSignal === "Long"
        ? "bg-green-500/20 text-green-400 border-green-500/30"
        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <div className="relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-trading-borderColor">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
            SC
          </div>
          <span className="font-semibold text-sm text-white">Crypto and Forex Trading</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${signalColor}`}
          >
            Lệnh Chờ {activeSignal}
            <span className="w-2 h-2 rounded-full bg-current animate-pulse_glow" />
          </button>

          <button
            onClick={onTogglePairSelector}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary border border-trading-borderColor text-xs font-medium text-white hover:bg-secondary/80 transition-all"
          >
            <div className="text-left leading-tight">
              <div>{selectedPair.symbol} - {selectedPair.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {getMarketLabel(selectedPair.marketType)} · {selectedPair.venue}
              </div>
            </div>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showPairSelector && (
        <div className="absolute top-full right-4 z-50 mt-1 w-60 bg-card border border-trading-borderColor rounded-lg shadow-2xl overflow-hidden">
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
              <div className="text-left">
                <div className="font-medium">{pair.symbol}</div>
                <div className="text-[10px] text-muted-foreground">{pair.name}</div>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                <div>{getMarketLabel(pair.marketType)}</div>
                <div>{pair.venue}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
