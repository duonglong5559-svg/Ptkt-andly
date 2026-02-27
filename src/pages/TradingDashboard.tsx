import { useState, useMemo } from "react";
import TradingHeader from "@/components/TradingHeader";
import SentimentBar from "@/components/SentimentBar";
import TimeframeSelector from "@/components/TimeframeSelector";
import CandlestickChart from "@/components/CandlestickChart";
import ResizableChart from "@/components/ResizableChart";
import SignalTabs from "@/components/SignalTabs";
import ResistanceCard from "@/components/ResistanceCard";
import AIAnalysis from "@/components/AIAnalysis";
import LiquidityPanel from "@/components/LiquidityPanel";
import {
  tradingPairs,
  generateCandleData,
  getResistanceLevels,
  Timeframe,
} from "@/data/tradingData";
import { calculateStandardPivot, getPreviousCandleForPivot } from "@/lib/pivotUtils";
import { useForexPrice } from "@/hooks/useForexPrice";

export default function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>("4H");
  const [activeTab, setActiveTab] = useState("trendlines");
  const [showPairSelector, setShowPairSelector] = useState(false);

  const effectivePair = useForexPrice(selectedPair);

  const candles = useMemo(
    () => generateCandleData(effectivePair, 50),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectivePair, timeframe]
  );

  const { pivotPrice, pairWithPivot } = useMemo(() => {
    const prev = getPreviousCandleForPivot(candles);
    if (prev) {
      const pivots = calculateStandardPivot(prev);
      return {
        pivotPrice: pivots.pivot,
        pairWithPivot: { ...effectivePair, pivotPrice: pivots.pivot },
      };
    }
    return { pivotPrice: effectivePair.pivotPrice, pairWithPivot: effectivePair };
  }, [candles, effectivePair]);

  const levels = useMemo(
    () => getResistanceLevels(effectivePair, { minConfidence: 85 }),
    [effectivePair]
  );

  const resistanceLevels = levels.filter((l) => l.type === "resistance");
  const supportLevels = levels.filter((l) => l.type === "support");

  const renderTabContent = () => {
    switch (activeTab) {
      case "ai":
        return (
          <AIAnalysis
            symbol={effectivePair.symbol}
            signal={effectivePair.signal}
            pivotPrice={pivotPrice}
            liquidityScore={effectivePair.bullish}
          />
        );

      case "live":
        return (
          <div className="px-4 py-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse_glow" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Tín hiệu Live đang hoạt động</h3>
            <p className="text-xs text-muted-foreground">
              Hệ thống đang theo dõi {effectivePair.symbol} trên khung {timeframe}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-trading-green text-lg font-bold">{effectivePair.bullish}%</div>
                <div className="text-[10px] text-muted-foreground">Bullish</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-trading-red text-lg font-bold">{effectivePair.bearish}%</div>
                <div className="text-[10px] text-muted-foreground">Bearish</div>
              </div>
            </div>
          </div>
        );

      case "analysis":
        return (
          <div className="px-4 py-4 space-y-3">
            <LiquidityPanel symbol={effectivePair.symbol} />
            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Tổng quan · Pivot chuẩn (H+L+C)/3</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Xu hướng chính:</span>
                  <span className={effectivePair.bullish > 50 ? "text-trading-green" : "text-trading-red"}>
                    {effectivePair.bullish > 60 ? "Tăng mạnh" : effectivePair.bullish > 50 ? "Tăng nhẹ" : "Giảm"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pivot Point:</span>
                  <span className="text-white">${pivotPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giá hiện tại:</span>
                  <span className="text-white">${effectivePair.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vị thế đề xuất:</span>
                  <span className={
                    effectivePair.signal === "Long" ? "text-trading-green font-bold" :
                    effectivePair.signal === "Short" ? "text-trading-red font-bold" :
                    "text-yellow-400 font-bold"
                  }>
                    {effectivePair.signal}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Chỉ báo kỹ thuật (tỉ lệ cao)</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>RSI (14):</span>
                  <span className="text-yellow-400">56.3 - Trung tính</span>
                </div>
                <div className="flex justify-between">
                  <span>MACD:</span>
                  <span className="text-trading-green">Bullish crossover</span>
                </div>
                <div className="flex justify-between">
                  <span>EMA 20/50:</span>
                  <span className="text-trading-green">Golden cross</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="text-white">Trên trung bình</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "trendlines":
        return (
          <div>
            {/* Resistance section */}
            {resistanceLevels.map((level) => (
              <ResistanceCard key={level.id} level={level} />
            ))}
            {/* Support section */}
            {supportLevels.map((level) => (
              <ResistanceCard key={level.id} level={level} />
            ))}
          </div>
        );

      case "futures": {
        const fundingRate = effectivePair.symbol.includes("BTC") ? 0.0085 : effectivePair.symbol.includes("ETH") ? 0.0062 : 0.0041;
        const longRatio = effectivePair.bullish;
        const shortRatio = effectivePair.bearish;
        const openInterest = effectivePair.symbol.includes("BTC") ? "12.4B" : effectivePair.symbol.includes("ETH") ? "5.2B" : "1.8B";
        return (
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-lg">⚡</span>
              <div>
                <h3 className="text-sm font-semibold text-white">Futures {effectivePair.symbol}</h3>
                <p className="text-[10px] text-muted-foreground">Leverage, funding, open interest</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/30 rounded-lg p-3 text-center border border-trading-borderColor">
                <div className={`text-sm font-bold ${fundingRate >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                  {fundingRate >= 0 ? "+" : ""}{(fundingRate * 100).toFixed(3)}%
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Funding Rate 8h</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center border border-trading-borderColor">
                <div className="text-trading-green text-sm font-bold">{longRatio}%</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Long Ratio</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center border border-trading-borderColor">
                <div className="text-trading-red text-sm font-bold">{shortRatio}%</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Short Ratio</div>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold text-trading-gold">Chi tiết</h4>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Open Interest</span>
                <span className="text-white">${openInterest}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Funding (Long pay Short)</span>
                <span className={fundingRate > 0 ? "text-trading-red" : "text-trading-green"}>
                  {fundingRate > 0 ? "Long trả" : "Short trả"}
                </span>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-trading-darkBg text-white max-w-lg mx-auto"
      onClick={() => showPairSelector && setShowPairSelector(false)}
    >
      <TradingHeader
        pairs={tradingPairs}
        selectedPair={selectedPair}
        onSelectPair={setSelectedPair}
        showPairSelector={showPairSelector}
        onTogglePairSelector={() => setShowPairSelector((p) => !p)}
      />

      <SentimentBar bullish={effectivePair.bullish} bearish={effectivePair.bearish} />

      <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

      <div className="relative">
        <div className="absolute top-2 left-3 z-10 text-[10px] text-muted-foreground/70">
          Giá đang tại {effectivePair.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}.{" "}
          Pivot chuẩn: ${pivotPrice.toFixed(2)}
        </div>
        <ResizableChart defaultHeight={360} minHeight={220} maxHeight={520}>
          <CandlestickChart candles={candles} pair={pairWithPivot} levels={levels} />
        </ResizableChart>
      </div>

      <SignalTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        trendLineCount={selectedPair.trendLines}
      />

      <div className="pb-20">{renderTabContent()}</div>
    </div>
  );
}
