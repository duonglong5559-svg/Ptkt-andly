import { useState, useMemo } from "react";
import TradingHeader from "@/components/TradingHeader";
import SentimentBar from "@/components/SentimentBar";
import TimeframeSelector from "@/components/TimeframeSelector";
import CandlestickChart from "@/components/CandlestickChart";
import SignalTabs from "@/components/SignalTabs";
import ResistanceCard from "@/components/ResistanceCard";
import AIAnalysis from "@/components/AIAnalysis";
import LiquidityHeatmap from "@/components/LiquidityHeatmap";
import {
  tradingPairs,
  generateCandleData,
  getResistanceLevels,
  calculateTechnicalIndicators,
  generateFuturesData,
  generateLiquidityData,
  Timeframe,
} from "@/data/tradingData";
import { TrendingUp, TrendingDown, Filter } from "lucide-react";

export default function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>("4H");
  const [activeTab, setActiveTab] = useState("trendlines");
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [showStrongOnly, setShowStrongOnly] = useState(true);

  const candles = useMemo(
    () => generateCandleData(selectedPair, 50),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPair, timeframe]
  );

  const indicators = useMemo(
    () => calculateTechnicalIndicators(candles),
    [candles]
  );

  const levels = useMemo(() => getResistanceLevels(selectedPair, candles), [selectedPair, candles]);

  const filteredLevels = useMemo(() => {
    if (!showStrongOnly) return levels;
    return levels.filter((l) => l.strength === "Rất mạnh" || l.strength === "Mạnh");
  }, [levels, showStrongOnly]);

  const futuresData = useMemo(() => generateFuturesData(selectedPair), [selectedPair]);
  const liquidityData = useMemo(() => generateLiquidityData(selectedPair, candles), [selectedPair, candles]);

  const resistanceLevels = filteredLevels.filter((l) => l.type === "resistance");
  const supportLevels = filteredLevels.filter((l) => l.type === "support");
  const chartLevels = filteredLevels;

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
              {selectedPair.category === "forex" && " (Dữ liệu từ sàn Forex)"}
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
            {indicators.probability > 65 && (
              <div className="mt-3 p-2 bg-trading-green/10 border border-trading-green/20 rounded-lg">
                <div className="text-xs text-trading-green font-semibold">
                  Kèo tỉ lệ cao ({indicators.probability}%) — {selectedPair.signal}
                </div>
              </div>
            )}
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
                  <span className={indicators.probability > 50 ? "text-trading-green" : "text-trading-red"}>
                    {indicators.probability > 65 ? "Tăng mạnh" : indicators.probability > 50 ? "Tăng nhẹ" : indicators.probability > 35 ? "Giảm nhẹ" : "Giảm mạnh"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pivot Point (chuẩn):</span>
                  <span className="text-white">{indicators.pivotPoints.pivot.toFixed(selectedPair.decimals)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giá hiện tại:</span>
                  <span className="text-white">{selectedPair.currentPrice.toFixed(selectedPair.decimals)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vị thế đề xuất:</span>
                  <span className={
                    selectedPair.signal === "Long" ? "text-trading-green font-bold" :
                    selectedPair.signal === "Short" ? "text-trading-red font-bold" :
                    "text-yellow-400 font-bold"
                  }>
                    {selectedPair.signal}
                    {indicators.probability > 65 && " ★ Kèo cao"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Pivot Points (Chuẩn)</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-red-400/70">
                  <span>R3:</span>
                  <span className="font-mono">{indicators.pivotPoints.r3.toFixed(selectedPair.decimals)}</span>
                </div>
                <div className="flex justify-between text-red-400/80">
                  <span>R2:</span>
                  <span className="font-mono">{indicators.pivotPoints.r2.toFixed(selectedPair.decimals)}</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>R1:</span>
                  <span className="font-mono">{indicators.pivotPoints.r1.toFixed(selectedPair.decimals)}</span>
                </div>
                <div className="flex justify-between text-trading-gold font-bold border-y border-trading-borderColor py-1">
                  <span>Pivot:</span>
                  <span className="font-mono">{indicators.pivotPoints.pivot.toFixed(selectedPair.decimals)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>S1:</span>
                  <span className="font-mono">{indicators.pivotPoints.s1.toFixed(selectedPair.decimals)}</span>
                </div>
                <div className="flex justify-between text-green-400/80">
                  <span>S2:</span>
                  <span className="font-mono">{indicators.pivotPoints.s2.toFixed(selectedPair.decimals)}</span>
                </div>
                <div className="flex justify-between text-green-400/70">
                  <span>S3:</span>
                  <span className="font-mono">{indicators.pivotPoints.s3.toFixed(selectedPair.decimals)}</span>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Chỉ báo kỹ thuật</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>RSI (14):</span>
                  <span className={
                    indicators.rsi > 70 ? "text-trading-red" :
                    indicators.rsi < 30 ? "text-trading-green" :
                    "text-yellow-400"
                  }>
                    {indicators.rsi} — {indicators.rsiSignal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MACD:</span>
                  <span className={indicators.macdSignal.includes("Bullish") ? "text-trading-green" : indicators.macdSignal.includes("Bearish") ? "text-trading-red" : "text-yellow-400"}>
                    {indicators.macdSignal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>EMA 20/50:</span>
                  <span className={indicators.emaCross === "Golden cross" ? "text-trading-green" : indicators.emaCross === "Death cross" ? "text-trading-red" : "text-yellow-400"}>
                    {indicators.emaCross}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ATR:</span>
                  <span className="text-white">{indicators.atr}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="text-white">{indicators.volume}</span>
                </div>
              </div>
            </div>

            {selectedPair.category === "forex" && (
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="text-[10px] text-blue-400">
                  📡 Dữ liệu {selectedPair.symbol} được lấy từ sàn Forex. Pivot Points tính theo công thức chuẩn (H+L+C)/3.
                </div>
              </div>
            )}
          </div>
        );

      case "trendlines":
        return (
          <div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-trading-borderColor">
              <span className="text-[10px] text-muted-foreground">
                {showStrongOnly ? "Chỉ hiện vùng cứng (Rất mạnh & Mạnh)" : "Hiện tất cả vùng"}
              </span>
              <button
                onClick={() => setShowStrongOnly((p) => !p)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  showStrongOnly
                    ? "bg-trading-gold/20 text-trading-gold border border-trading-gold/30"
                    : "bg-secondary/30 text-muted-foreground border border-trading-borderColor"
                }`}
              >
                <Filter className="w-3 h-3" />
                {showStrongOnly ? "Chỉ vùng cứng" : "Tất cả"}
              </button>
            </div>
            {resistanceLevels.map((level) => (
              <ResistanceCard key={level.id} level={level} decimals={selectedPair.decimals} />
            ))}
            {supportLevels.map((level) => (
              <ResistanceCard key={level.id} level={level} decimals={selectedPair.decimals} />
            ))}
            {filteredLevels.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                Không có vùng kháng cự/hỗ trợ đủ mạnh. Thử tắt bộ lọc.
              </div>
            )}
          </div>
        );

      case "futures":
        return (
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-blue-400 text-lg">⚡</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Futures Trading</h3>
                <div className="text-[10px] text-muted-foreground">
                  Dữ liệu derivatives cho {selectedPair.symbol}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                <div className={`text-sm font-bold ${futuresData.fundingRate >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                  {futuresData.fundingRate >= 0 ? "+" : ""}{(futuresData.fundingRate * 100).toFixed(4)}%
                </div>
                <div className="text-[10px] text-muted-foreground">Funding Rate</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                <div className="text-trading-green text-sm font-bold">{futuresData.longRatio}%</div>
                <div className="text-[10px] text-muted-foreground">Long Ratio</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                <div className="text-trading-red text-sm font-bold">{futuresData.shortRatio}%</div>
                <div className="text-[10px] text-muted-foreground">Short Ratio</div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold text-trading-gold">Chi tiết Futures</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Open Interest:</span>
                  <span className="text-white">${(futuresData.openInterest / 1e9).toFixed(2)}B
                    <span className={`ml-1 ${futuresData.openInterestChange > 0 ? "text-trading-green" : "text-trading-red"}`}>
                      ({futuresData.openInterestChange > 0 ? "+" : ""}{futuresData.openInterestChange}%)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Next Funding:</span>
                  <span className="text-white">{futuresData.nextFunding}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume 24h:</span>
                  <span className="text-white">${(futuresData.volume24h / 1e9).toFixed(2)}B</span>
                </div>
                <div className="flex justify-between">
                  <span>Top Trader L/S:</span>
                  <span className="text-white">{futuresData.topTraderLongShort.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Liquidations 24h</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-trading-green flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Long
                    </span>
                    <span className="text-trading-green">${(futuresData.liquidations24h.long / 1e6).toFixed(1)}M</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-trading-green rounded-full"
                      style={{ width: `${(futuresData.liquidations24h.long / (futuresData.liquidations24h.long + futuresData.liquidations24h.short)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-trading-red flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Short
                    </span>
                    <span className="text-trading-red">${(futuresData.liquidations24h.short / 1e6).toFixed(1)}M</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-trading-red rounded-full"
                      style={{ width: `${(futuresData.liquidations24h.short / (futuresData.liquidations24h.long + futuresData.liquidations24h.short)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {selectedPair.category !== "forex" && futuresData.fundingRate > 0.0005 && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="text-[10px] text-yellow-400">
                  ⚠️ Funding rate cao — Long đang trả phí. Cẩn thận squeeze nếu giá giảm.
                </div>
              </div>
            )}
          </div>
        );

      case "ai":
        return <AIAnalysis pair={selectedPair} indicators={indicators} candles={candles} />;

      case "liquidity":
        return <LiquidityHeatmap pair={selectedPair} liquidityData={liquidityData} />;

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

      <SentimentBar bullish={selectedPair.bullish} bearish={selectedPair.bearish} />

      <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

      <div className="relative">
        <div className="absolute top-2 left-3 z-10 text-[10px] text-muted-foreground/70">
          {selectedPair.currentPrice > indicators.pivotPoints.pivot
            ? `Giá trên Pivot (${indicators.pivotPoints.pivot.toFixed(selectedPair.decimals)}), xu hướng tăng`
            : `Giá dưới Pivot (${indicators.pivotPoints.pivot.toFixed(selectedPair.decimals)}), xu hướng giảm`}
          {selectedPair.category === "forex" && " · Forex"}
        </div>
        <CandlestickChart candles={candles} pair={selectedPair} levels={chartLevels} />
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
