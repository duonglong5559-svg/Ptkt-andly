import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import TradingHeader from "@/components/TradingHeader";
import SentimentBar from "@/components/SentimentBar";
import TimeframeSelector from "@/components/TimeframeSelector";
import CandlestickChart from "@/components/CandlestickChart";
import SignalTabs from "@/components/SignalTabs";
import ResistanceCard from "@/components/ResistanceCard";
import {
  tradingPairs,
  generateCandleData,
  getResistanceLevels,
  Timeframe,
} from "@/data/tradingData";
import { fetchCandles } from "@/lib/marketData/fetchCandles";

export default function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>("4H");
  const [activeTab, setActiveTab] = useState("trendlines");
  const [showPairSelector, setShowPairSelector] = useState(false);

  const candlesQuery = useQuery({
    queryKey: ["candles", selectedPair.kind, selectedPair.marketSymbol, timeframe],
    queryFn: ({ signal }) =>
      fetchCandles({
        kind: selectedPair.kind,
        symbol: selectedPair.marketSymbol,
        timeframe,
        limit: 80,
        signal,
      }),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  });

  const candles = useMemo(() => {
    const fromApi = candlesQuery.data?.candles;
    if (fromApi && fromApi.length > 0) return fromApi;
    return generateCandleData(selectedPair, 50);
  }, [candlesQuery.data?.candles, selectedPair]);

  const derivedPair = useMemo(() => {
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const currentPrice = last?.close ?? selectedPair.currentPrice;
    const pivotPrice =
      prev && Number.isFinite(prev.high) && Number.isFinite(prev.low) && Number.isFinite(prev.close)
        ? Number(((prev.high + prev.low + prev.close) / 3).toFixed(2))
        : selectedPair.pivotPrice;

    const sample = candles.slice(-20);
    const up = sample.filter((c) => c.close >= c.open).length;
    const bullish = sample.length > 0 ? Math.round((up / sample.length) * 100) : selectedPair.bullish;
    const bearish = 100 - bullish;
    const signal = currentPrice > pivotPrice ? "Long" : currentPrice < pivotPrice ? "Short" : "Neutral";

    return {
      ...selectedPair,
      currentPrice,
      pivotPrice,
      buyPrice: currentPrice,
      sellPrice: currentPrice * (signal === "Long" ? 1.006 : 0.994),
      bullish,
      bearish,
      signal,
    };
  }, [candles, selectedPair]);

  const levels = useMemo(() => getResistanceLevels(derivedPair), [derivedPair]);

  const resistanceLevels = levels.filter((l) => l.type === "resistance");
  const supportLevels = levels.filter((l) => l.type === "support");

  const renderTabContent = () => {
    switch (activeTab) {
      case "live":
        return (
          <div className="px-4 py-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse_glow" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Tín hiệu Live đang hoạt động</h3>
            <p className="text-xs text-muted-foreground">
              Hệ thống đang theo dõi {selectedPair.symbol} trên khung {timeframe}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-trading-green text-lg font-bold">{selectedPair.bullish}%</div>
                <div className="text-[10px] text-muted-foreground">Bullish</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-trading-red text-lg font-bold">{selectedPair.bearish}%</div>
                <div className="text-[10px] text-muted-foreground">Bearish</div>
              </div>
            </div>
          </div>
        );

      case "analysis":
        return (
          <div className="px-4 py-4 space-y-3">
            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Tổng quan thị trường</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Xu hướng chính:</span>
                  <span className={selectedPair.bullish > 50 ? "text-trading-green" : "text-trading-red"}>
                    {selectedPair.bullish > 60 ? "Tăng mạnh" : selectedPair.bullish > 50 ? "Tăng nhẹ" : "Giảm"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pivot Point:</span>
                  <span className="text-white">${selectedPair.pivotPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giá hiện tại:</span>
                  <span className="text-white">${selectedPair.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vị thế đề xuất:</span>
                  <span className={
                    selectedPair.signal === "Long" ? "text-trading-green font-bold" :
                    selectedPair.signal === "Short" ? "text-trading-red font-bold" :
                    "text-yellow-400 font-bold"
                  }>
                    {selectedPair.signal}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Chỉ báo kỹ thuật</h4>
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

      case "futures":
        return (
          <div className="px-4 py-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
              <span className="text-blue-400 text-lg">⚡</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Futures Trading</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Phân tích leverage và funding rate cho {selectedPair.symbol}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <div className="text-white text-sm font-bold">0.01%</div>
                <div className="text-[10px] text-muted-foreground">Funding Rate</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <div className="text-trading-green text-sm font-bold">52.3%</div>
                <div className="text-[10px] text-muted-foreground">Long Ratio</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <div className="text-trading-red text-sm font-bold">47.7%</div>
                <div className="text-[10px] text-muted-foreground">Short Ratio</div>
              </div>
            </div>
          </div>
        );

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
        selectedPair={derivedPair}
        onSelectPair={setSelectedPair}
        showPairSelector={showPairSelector}
        onTogglePairSelector={() => setShowPairSelector((p) => !p)}
      />

      <SentimentBar bullish={derivedPair.bullish} bearish={derivedPair.bearish} />

      <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

      <div className="relative">
        <div className="absolute top-2 left-3 z-10 text-[10px] text-muted-foreground/70">
          {candlesQuery.data?.source && (
            <span className="mr-2">
              Nguồn dữ liệu:{" "}
              <span className={candlesQuery.data.source === "mock" ? "text-yellow-300" : "text-green-400"}>
                {candlesQuery.data.source.toUpperCase()}
              </span>
            </span>
          )}
          Giá đang tại {derivedPair.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}.{" "}
          Giá đang {derivedPair.currentPrice >= derivedPair.pivotPrice ? "ở phía trên" : "ở phía dưới"} Pivot (
          {derivedPair.pivotPrice.toFixed(2)})
        </div>
        <CandlestickChart candles={candles} pair={derivedPair} levels={levels} />
      </div>

      <SignalTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        trendLineCount={derivedPair.trendLines}
      />

      <div className="pb-20">{renderTabContent()}</div>
    </div>
  );
}
