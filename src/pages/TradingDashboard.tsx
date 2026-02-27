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
  getTechnicalSnapshot,
  getMarketLabel,
  Timeframe,
} from "@/data/tradingData";
import { fetchLiquidityHeatmap } from "@/lib/liquidityHeatmap";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export default function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>("4H");
  const [activeTab, setActiveTab] = useState("analysis");
  const [showPairSelector, setShowPairSelector] = useState(false);

  const candles = useMemo(
    () => generateCandleData(selectedPair, timeframe, 110),
    [selectedPair, timeframe]
  );
  const technicalSnapshot = useMemo(
    () => getTechnicalSnapshot(selectedPair, candles),
    [selectedPair, candles]
  );

  const levels = useMemo(
    () => getResistanceLevels(selectedPair, candles, technicalSnapshot),
    [selectedPair, candles, technicalSnapshot]
  );

  const resistanceLevels = levels.filter((l) => l.type === "resistance");
  const supportLevels = levels.filter((l) => l.type === "support");
  const analysisReady = technicalSnapshot.qualifiesForAnalysis;
  const highProbabilityCount = levels.length;
  const marketLabel = getMarketLabel(selectedPair.marketType);
  const rsiLabel =
    technicalSnapshot.rsi > 70
      ? "Quá mua"
      : technicalSnapshot.rsi < 30
        ? "Quá bán"
        : "Trung tính";
  const longRatio = Math.round(clamp(50 + (technicalSnapshot.highProbabilityScore - 50) * 0.45, 35, 78));
  const shortRatio = 100 - longRatio;

  const { data: liquidityData, isLoading: isLiquidityLoading } = useQuery({
    queryKey: ["liquidity-heatmap", selectedPair.symbol],
    queryFn: () => fetchLiquidityHeatmap(selectedPair.symbol, selectedPair.currentPrice),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

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
              Theo dõi {selectedPair.symbol} ({marketLabel}) tại {selectedPair.venue} trên khung {timeframe}
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
            <div className="mt-3 text-xs">
              <span className="text-emerald-300 font-semibold">
                High-probability score: {technicalSnapshot.highProbabilityScore}/100
              </span>
            </div>
          </div>
        );

      case "analysis":
        return (
          <div className="px-4 py-4 space-y-3">
            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Tổng quan thị trường (chuẩn pivot)</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Xu hướng chính:</span>
                  <span
                    className={
                      technicalSnapshot.trend === "Tăng"
                        ? "text-trading-green"
                        : technicalSnapshot.trend === "Giảm"
                          ? "text-trading-red"
                          : "text-yellow-400"
                    }
                  >
                    {technicalSnapshot.trend}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pivot Point:</span>
                  <span className="text-white">
                    ${technicalSnapshot.pivotPoint.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giá hiện tại:</span>
                  <span className="text-white">
                    ${selectedPair.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vị thế đề xuất:</span>
                  <span
                    className={
                      technicalSnapshot.signal === "Long"
                        ? "text-trading-green font-bold"
                        : technicalSnapshot.signal === "Short"
                          ? "text-trading-red font-bold"
                          : "text-yellow-400 font-bold"
                    }
                  >
                    {technicalSnapshot.signal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kèo tỉ lệ cao:</span>
                  <span className={analysisReady ? "text-emerald-300 font-semibold" : "text-orange-300 font-semibold"}>
                    {analysisReady ? "Đủ điều kiện phân tích" : "Chưa đủ điều kiện"}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Chỉ báo kỹ thuật</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>RSI (14):</span>
                  <span className="text-yellow-300">
                    {technicalSnapshot.rsi.toFixed(1)} - {rsiLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MACD:</span>
                  <span
                    className={technicalSnapshot.macd >= technicalSnapshot.macdSignal ? "text-trading-green" : "text-trading-red"}
                  >
                    {technicalSnapshot.macd >= technicalSnapshot.macdSignal
                      ? "Bullish crossover"
                      : "Bearish crossover"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>EMA 20/50:</span>
                  <span
                    className={technicalSnapshot.ema20 >= technicalSnapshot.ema50 ? "text-trading-green" : "text-trading-red"}
                  >
                    {technicalSnapshot.ema20.toFixed(2)} / {technicalSnapshot.ema50.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Volume ratio:</span>
                  <span className="text-white">{technicalSnapshot.volumeRatio.toFixed(2)}x</span>
                </div>
              </div>
            </div>
            {!analysisReady && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-xs text-orange-200">
                Hệ thống chỉ ưu tiên phân tích khi score cao, volume xác nhận và tín hiệu không bị nhiễu.
              </div>
            )}
          </div>
        );

      case "llm":
        return (
          <div className="px-4 py-4 space-y-3">
            <div className="bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-trading-gold">LLM High-Probability Engine</h4>
                <span className="text-[10px] text-muted-foreground">{selectedPair.llmModel}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-black/20 rounded-md p-2">
                  <div className="text-emerald-300 font-semibold">{technicalSnapshot.highProbabilityScore}/100</div>
                  <div className="text-[10px] text-muted-foreground">Confidence</div>
                </div>
                <div className="bg-black/20 rounded-md p-2">
                  <div className="text-white font-semibold">{technicalSnapshot.llmBias}</div>
                  <div className="text-[10px] text-muted-foreground">LLM Bias</div>
                </div>
                <div className="bg-black/20 rounded-md p-2">
                  <div className="text-white font-semibold">{highProbabilityCount}</div>
                  <div className="text-[10px] text-muted-foreground">Setup đủ chuẩn</div>
                </div>
              </div>
              <div className="space-y-2">
                {technicalSnapshot.llmReasons.map((reason, index) => (
                  <div key={index} className="text-xs text-muted-foreground leading-relaxed">
                    • {reason}
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`rounded-lg p-3 text-xs border ${
                analysisReady
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-200"
              }`}
            >
              Rule filter: chỉ đẩy lên phân tích khi tín hiệu đạt ngưỡng xác suất cao và SR đủ cứng.
            </div>
          </div>
        );

      case "trendlines":
        return (
          <div>
            {levels.length === 0 && (
              <div className="px-4 py-5 text-xs text-center text-muted-foreground">
                Chưa có vùng hỗ trợ/kháng cự cứng đủ chuẩn. Hệ thống tạm thời không đề xuất kèo.
              </div>
            )}
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

      case "liquidity":
        return (
          <div className="px-4 py-4 space-y-3">
            <div className="bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-trading-gold">Liquidity Heatmap (LiquiHeart)</h4>
                <span className="text-[10px] text-muted-foreground">
                  {isLiquidityLoading ? "Đang tải..." : liquidityData?.source ?? "No source"}
                </span>
              </div>
              {!liquidityData && isLiquidityLoading && (
                <div className="text-xs text-muted-foreground">Đang đồng bộ heatmap thanh khoản...</div>
              )}
              {liquidityData && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-black/20 rounded-md p-2">
                      <div className="text-[10px] text-muted-foreground">Bid Liquidity</div>
                      <div className="text-emerald-300 font-semibold">
                        ${compactNumber.format(liquidityData.totalBidLiquidity)}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-md p-2">
                      <div className="text-[10px] text-muted-foreground">Ask Liquidity</div>
                      <div className="text-red-300 font-semibold">
                        ${compactNumber.format(liquidityData.totalAskLiquidity)}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-md p-2">
                      <div className="text-[10px] text-muted-foreground">Imbalance</div>
                      <div className={liquidityData.imbalance >= 0 ? "text-emerald-300 font-semibold" : "text-red-300 font-semibold"}>
                        {liquidityData.imbalance.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-md p-2">
                      <div className="text-[10px] text-muted-foreground">Concentration</div>
                      <div className="text-white font-semibold">{liquidityData.concentration.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {liquidityData.hotspots.map((hotspot, index) => (
                      <div
                        key={`${hotspot.side}-${hotspot.price}-${index}`}
                        className="rounded-md border border-trading-borderColor bg-black/20 p-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={hotspot.side === "bid" ? "text-emerald-300" : "text-red-300"}>
                            {hotspot.side.toUpperCase()} @ {hotspot.price.toLocaleString("en-US")}
                          </span>
                          <span className="text-muted-foreground">Intensity {hotspot.intensity}%</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">{hotspot.note}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "futures":
        return (
          <div className="px-4 py-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
              <span className="text-blue-400 text-lg">⚡</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Futures / Forex Context</h3>
            {selectedPair.marketType === "forex_spot" ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {selectedPair.symbol} đang lấy từ sàn Forex ({selectedPair.venue}) nên dùng logic spot thay vì funding
                  futures.
                </p>
                <div className="bg-secondary/30 rounded-lg p-3 text-left text-xs text-muted-foreground">
                  <div>• Cặp này có thể phân tích trực tiếp theo thanh khoản + pivot chuẩn.</div>
                  <div>• Không hiển thị funding rate để tránh demo sai ngữ cảnh.</div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  Derivatives metrics đồng bộ theo technical score + liquidity imbalance.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <div className="text-white text-sm font-bold">
                      {((technicalSnapshot.macd - technicalSnapshot.macdSignal) * 0.01).toFixed(3)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Funding Rate</div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <div className="text-trading-green text-sm font-bold">{longRatio}%</div>
                    <div className="text-[10px] text-muted-foreground">Long Ratio</div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <div className="text-trading-red text-sm font-bold">{shortRatio}%</div>
                    <div className="text-[10px] text-muted-foreground">Short Ratio</div>
                  </div>
                </div>
              </>
            )}
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
        selectedPair={selectedPair}
        activeSignal={technicalSnapshot.signal}
        onSelectPair={setSelectedPair}
        showPairSelector={showPairSelector}
        onTogglePairSelector={() => setShowPairSelector((p) => !p)}
      />

      <SentimentBar bullish={selectedPair.bullish} bearish={selectedPair.bearish} />

      <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

      <div className="relative">
        <div className="absolute top-2 left-3 z-10 text-[10px] text-muted-foreground/70">
          Giá đang tại {selectedPair.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}.{" "}
          Giá hiện {selectedPair.currentPrice >= technicalSnapshot.pivotPoint ? "trên" : "dưới"} Pivot (
          {technicalSnapshot.pivotPoint.toFixed(2)})
        </div>
        <CandlestickChart
          key={`${selectedPair.symbol}-${timeframe}`}
          candles={candles}
          pair={selectedPair}
          levels={levels}
          pivotPrice={technicalSnapshot.pivotPoint}
        />
      </div>

      <SignalTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        trendLineCount={highProbabilityCount}
        highProbabilityCount={highProbabilityCount}
      />

      <div className="pb-20">{renderTabContent()}</div>
    </div>
  );
}
