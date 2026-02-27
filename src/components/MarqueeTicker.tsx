import { useEffect, useState, useRef } from "react";
import { fetchMultipleTickers, TRADING_PAIRS, TickerData } from "@/lib/binanceApi";
import { formatPrice } from "@/data/tradingData";
import { TrendingUp, TrendingDown, Zap, Brain } from "lucide-react";
import { AIAnalysisScore, EntrySignal } from "@/lib/technicalAnalysis";

interface MarqueeTickerProps {
  aiScore: AIAnalysisScore;
  signal: EntrySignal;
  currentSymbol: string;
}

export default function MarqueeTicker({ aiScore, signal, currentSymbol }: MarqueeTickerProps) {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const symbols = TRADING_PAIRS.map((p) => p.symbol);
        const data = await fetchMultipleTickers(symbols);
        setTickers(data);
      } catch {
        /* silent */
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const aiColor = aiScore.overall >= 60 ? "text-green-400" : aiScore.overall <= 40 ? "text-red-400" : "text-yellow-400";
  const signalColor = signal.type === "Long" ? "text-green-400" : signal.type === "Short" ? "text-red-400" : "text-yellow-400";
  const pairName = TRADING_PAIRS.find((p) => p.symbol === currentSymbol)?.short || currentSymbol;

  const aiText = `🤖 AI Score: ${aiScore.overall}/100 — ${aiScore.verdict}`;
  const signalText = `⚡ ${pairName}: ${signal.type} (${signal.confidence}% tin cậy) | Entry: $${formatPrice(signal.entry)} | TP1: $${formatPrice(signal.tp1)} | SL: $${formatPrice(signal.sl)}`;

  return (
    <div className="relative overflow-hidden border-b border-trading-borderColor bg-black/40">
      <div className="flex items-center">
        {/* AI badge */}
        <div className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-r border-trading-borderColor z-10">
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="text-[9px] font-bold text-purple-300">AI</span>
        </div>

        {/* Scrolling content */}
        <div ref={containerRef} className="flex-1 overflow-hidden">
          <div className="animate-marquee flex items-center gap-8 whitespace-nowrap py-1.5">
            {/* AI verdict */}
            <span className={`text-[10px] font-semibold ${aiColor} flex items-center gap-1`}>
              <Zap className="w-3 h-3" />
              {aiText}
            </span>

            <span className="text-trading-borderColor">│</span>

            {/* Signal */}
            <span className={`text-[10px] font-semibold ${signalColor}`}>
              {signalText}
            </span>

            <span className="text-trading-borderColor">│</span>

            {/* Ticker prices */}
            {tickers.map((t) => {
              const pair = TRADING_PAIRS.find((p) => p.symbol === t.symbol);
              const isUp = t.priceChangePercent >= 0;
              return (
                <span key={t.symbol} className="flex items-center gap-1 text-[10px]">
                  <span className="text-muted-foreground font-medium">{pair?.short || t.symbol}</span>
                  <span className="text-white">{formatPrice(t.lastPrice)}</span>
                  {isUp ? <TrendingUp className="w-2.5 h-2.5 text-trading-green" /> : <TrendingDown className="w-2.5 h-2.5 text-trading-red" />}
                  <span className={isUp ? "text-trading-green" : "text-trading-red"}>
                    {isUp ? "+" : ""}{t.priceChangePercent.toFixed(2)}%
                  </span>
                </span>
              );
            })}

            {/* Repeat for seamless loop */}
            <span className="text-trading-borderColor">│</span>
            <span className={`text-[10px] font-semibold ${aiColor} flex items-center gap-1`}>
              <Zap className="w-3 h-3" />
              {aiText}
            </span>
            <span className="text-trading-borderColor">│</span>
            <span className={`text-[10px] font-semibold ${signalColor}`}>
              {signalText}
            </span>
            <span className="text-trading-borderColor">│</span>
            {tickers.map((t) => {
              const pair = TRADING_PAIRS.find((p) => p.symbol === t.symbol);
              const isUp = t.priceChangePercent >= 0;
              return (
                <span key={`dup-${t.symbol}`} className="flex items-center gap-1 text-[10px]">
                  <span className="text-muted-foreground font-medium">{pair?.short || t.symbol}</span>
                  <span className="text-white">{formatPrice(t.lastPrice)}</span>
                  {isUp ? <TrendingUp className="w-2.5 h-2.5 text-trading-green" /> : <TrendingDown className="w-2.5 h-2.5 text-trading-red" />}
                  <span className={isUp ? "text-trading-green" : "text-trading-red"}>
                    {isUp ? "+" : ""}{t.priceChangePercent.toFixed(2)}%
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
