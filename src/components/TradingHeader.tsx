import { TRADING_PAIRS } from "@/lib/binanceApi";
import { TickerData } from "@/lib/binanceApi";
import { EntrySignal } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";
import { ChevronDown, Wifi, WifiOff } from "lucide-react";

interface TradingHeaderProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  ticker: TickerData | null;
  signal: EntrySignal;
  showPairSelector: boolean;
  onTogglePairSelector: () => void;
  isConnected: boolean;
  lastUpdate: number;
}

export default function TradingHeader({
  selectedSymbol,
  onSelectSymbol,
  ticker,
  signal,
  showPairSelector,
  onTogglePairSelector,
  isConnected,
}: TradingHeaderProps) {
  const pair = TRADING_PAIRS.find((p) => p.symbol === selectedSymbol) || TRADING_PAIRS[0];

  const signalColor =
    signal.type === "Short"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : signal.type === "Long"
        ? "bg-green-500/20 text-green-400 border-green-500/30"
        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  const changeColor = ticker && ticker.priceChangePercent >= 0 ? "text-trading-green" : "text-trading-red";

  const cryptoPairs = TRADING_PAIRS.filter((p) => p.category === "crypto");
  const commodityPairs = TRADING_PAIRS.filter((p) => p.category === "commodity");

  return (
    <div className="relative animate-fadeIn">
      <div className="flex items-center justify-between px-3 py-2 border-b border-trading-borderColor">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-[9px] font-bold text-white shadow-lg shadow-green-500/20">
            SC
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[10px] text-white leading-tight">Crypto & Forex</span>
            <div className="flex items-center gap-1">
              {isConnected ? <Wifi className="w-2 h-2 text-green-400" /> : <WifiOff className="w-2 h-2 text-red-400" />}
              <span className="text-[8px] text-muted-foreground">{isConnected ? "Live" : "Offline"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold ${signalColor}`}>
            {signal.type}
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-breathe" />
          </button>
          <button
            onClick={onTogglePairSelector}
            className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-secondary border border-trading-borderColor text-[9px] font-medium text-white hover:bg-secondary/80 transition-all"
          >
            <span>{pair.emoji}</span>
            {pair.short}
            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showPairSelector ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Price bar */}
      {ticker && (
        <div className="flex items-center justify-between px-3 py-1 border-b border-trading-borderColor bg-card/50">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">{formatPrice(ticker.lastPrice)}</span>
            <span className={`text-[10px] font-semibold ${changeColor}`}>
              {ticker.priceChangePercent >= 0 ? "+" : ""}{ticker.priceChangePercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex gap-2 text-[9px] text-muted-foreground">
            <span>H:<span className="text-white ml-0.5">{formatPrice(ticker.highPrice)}</span></span>
            <span>L:<span className="text-white ml-0.5">{formatPrice(ticker.lowPrice)}</span></span>
          </div>
        </div>
      )}

      {/* Pair selector dropdown */}
      {showPairSelector && (
        <div className="absolute top-full right-2 z-50 mt-1 w-56 bg-card border border-trading-borderColor rounded-lg shadow-2xl shadow-black/50 overflow-hidden animate-slideDown max-h-80 overflow-y-auto">
          <div className="px-3 py-1.5 text-[8px] font-bold text-trading-gold uppercase tracking-wider bg-secondary/30">Crypto</div>
          {cryptoPairs.map((p) => (
            <button
              key={p.symbol}
              onClick={() => { onSelectSymbol(p.symbol); onTogglePairSelector(); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] hover:bg-secondary/50 transition-all ${
                p.symbol === selectedSymbol ? "bg-secondary/30 text-green-400" : "text-white"
              }`}
            >
              <span className="font-medium">{p.emoji} {p.short}</span>
              <span className="text-muted-foreground text-[9px]">{p.name}</span>
            </button>
          ))}
          {commodityPairs.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[8px] font-bold text-trading-gold uppercase tracking-wider bg-secondary/30">Hàng hóa</div>
              {commodityPairs.map((p) => (
                <button
                  key={p.symbol}
                  onClick={() => { onSelectSymbol(p.symbol); onTogglePairSelector(); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] hover:bg-secondary/50 transition-all ${
                    p.symbol === selectedSymbol ? "bg-secondary/30 text-green-400" : "text-white"
                  }`}
                >
                  <span className="font-medium">{p.emoji} {p.short}</span>
                  <span className="text-muted-foreground text-[9px]">{p.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
