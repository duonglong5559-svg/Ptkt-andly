import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "react-resizable-panels";
import TradingHeader from "@/components/TradingHeader";
import SentimentBar from "@/components/SentimentBar";
import TimeframeSelector from "@/components/TimeframeSelector";
import CandlestickChart from "@/components/CandlestickChart";
import SignalTabs from "@/components/SignalTabs";
import ResistanceCard from "@/components/ResistanceCard";
import {
  tradingPairs,
  generateCandleData,
  Timeframe,
} from "@/data/tradingData";
import { fetchCandles } from "@/lib/marketData/fetchCandles";
import { computeHardLevelsForUI } from "@/lib/analysis/levels";
import { fetchLiquiheartLiquidity } from "@/lib/liquidity/liquiheart";
import { clearTrainingExamples, downloadJsonlFile, loadTrainingExamples, toJsonl } from "@/lib/dataset/trainingDataset";
import { toast } from "sonner";
import { fetchBinanceFuturesMetrics } from "@/lib/marketData/binanceFutures";

export default function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>("4H");
  const [activeTab, setActiveTab] = useState("trendlines");
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [showLiquidity, setShowLiquidity] = useState(false);

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

  const liquiditySymbol = useMemo(() => {
    if (derivedPair.kind === "forex") return derivedPair.symbol.replace("/", "");
    return derivedPair.marketSymbol;
  }, [derivedPair.kind, derivedPair.marketSymbol, derivedPair.symbol]);

  const liquidityQuery = useQuery({
    queryKey: ["liquidity", liquiditySymbol, timeframe, showLiquidity],
    queryFn: ({ signal }) => fetchLiquiheartLiquidity({ symbol: liquiditySymbol, timeframe, signal }),
    enabled: showLiquidity,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });

  const levelsResult = useMemo(
    () => computeHardLevelsForUI({ candles, currentPrice: derivedPair.currentPrice }),
    [candles, derivedPair.currentPrice]
  );
  const levels = levelsResult.levels;
  const highProbLevels = useMemo(
    () => levels.filter((l) => (l.rr ?? 0) >= 1.8 && l.confidence >= 85 && l.strength !== "Trung bình"),
    [levels]
  );

  const futuresQuery = useQuery({
    queryKey: ["futures", derivedPair.marketSymbol],
    queryFn: ({ signal }) => fetchBinanceFuturesMetrics({ symbol: derivedPair.marketSymbol, signal }),
    enabled: derivedPair.kind === "crypto" && activeTab === "futures",
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    retry: 1,
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
                  <span className={derivedPair.bullish > 50 ? "text-trading-green" : "text-trading-red"}>
                    {levelsResult.meta.trend === "up"
                      ? "Tăng"
                      : levelsResult.meta.trend === "down"
                        ? "Giảm"
                        : "Sideway"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pivot Point:</span>
                  <span className="text-white">
                    ${derivedPair.pivotPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giá hiện tại:</span>
                  <span className="text-white">
                    ${derivedPair.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vị thế đề xuất:</span>
                  <span className={
                    derivedPair.signal === "Long" ? "text-trading-green font-bold" :
                    derivedPair.signal === "Short" ? "text-trading-red font-bold" :
                    "text-yellow-400 font-bold"
                  }>
                    {derivedPair.signal}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-trading-gold mb-2">Chỉ báo kỹ thuật</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Hard SR:</span>
                  <span className="text-white">{levels.length} mức (lọc kèo tỉ lệ cao: {highProbLevels.length})</span>
                </div>
                <div className="flex justify-between">
                  <span>Pivot/Trend:</span>
                  <span className="text-white">{levelsResult.meta.trend.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nguồn dữ liệu:</span>
                  <span className="text-white">{(candlesQuery.data?.source ?? "mock").toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cảnh báo:</span>
                  <span className="text-yellow-300">
                    {candlesQuery.data?.warning ??
                      liquidityQuery.data?.warning ??
                      levelsResult.meta.warning ??
                      "—"}
                  </span>
                </div>
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const examples = loadTrainingExamples();
                      if (examples.length === 0) {
                        toast.error("Dataset trống.");
                        return;
                      }
                      downloadJsonlFile("training_dataset.jsonl", toJsonl(examples));
                      toast.success(`Đã tải ${examples.length} dòng JSONL`);
                    }}
                    className="flex-1 px-2 py-1 rounded-md text-[10px] border bg-secondary/40 text-white border-trading-borderColor hover:bg-secondary/60 transition-colors"
                  >
                    Download dataset (JSONL)
                  </button>
                  <button
                    onClick={() => {
                      clearTrainingExamples();
                      toast.success("Đã xoá dataset");
                    }}
                    className="px-2 py-1 rounded-md text-[10px] border bg-red-500/10 text-red-200 border-red-500/30 hover:bg-red-500/20 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "trendlines":
        return (
          <div>
            {/* Resistance section */}
            {highProbLevels
              .filter((l) => l.type === "resistance")
              .map((level) => (
              <ResistanceCard
                key={level.id}
                level={level}
                meta={{ symbol: derivedPair.symbol, timeframe, source: candlesQuery.data?.source }}
              />
            ))}
            {/* Support section */}
            {highProbLevels
              .filter((l) => l.type === "support")
              .map((level) => (
              <ResistanceCard
                key={level.id}
                level={level}
                meta={{ symbol: derivedPair.symbol, timeframe, source: candlesQuery.data?.source }}
              />
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
              {derivedPair.kind === "crypto"
                ? `Funding + Open Interest (Binance Futures) cho ${derivedPair.symbol}`
                : `Futures metrics cho ${derivedPair.symbol} cần API sàn/broker (chưa cấu hình)`}
            </p>
            {derivedPair.kind !== "crypto" ? (
              <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground">
                Gợi ý: kết nối OANDA/MT5 bridge hoặc datafeed futures (CME/ICE) để lấy funding/OI/liquidity theo chuẩn.
              </div>
            ) : futuresQuery.isError ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-200">
                Không lấy được dữ liệu Binance Futures (CORS/proxy). Đang hiển thị chế độ demo.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <div className="text-white text-sm font-bold">
                    {(((futuresQuery.data?.lastFundingRate ?? 0) * 100).toFixed(4))}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">Funding Rate</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <div className="text-white text-sm font-bold">
                    {(futuresQuery.data?.openInterest ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Open Interest</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <div className="text-white text-sm font-bold">
                    {(futuresQuery.data?.markPrice ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Mark Price</div>
                </div>
              </div>
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
        selectedPair={derivedPair}
        onSelectPair={setSelectedPair}
        showPairSelector={showPairSelector}
        onTogglePairSelector={() => setShowPairSelector((p) => !p)}
      />

      <SentimentBar bullish={derivedPair.bullish} bearish={derivedPair.bearish} />

      <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

      <ResizablePanelGroup direction="vertical" className="min-h-[calc(100vh-120px)]">
        <ResizablePanel defaultSize={55} minSize={30}>
          <div className="relative h-full">
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
            <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
              <button
                onClick={() => setShowLiquidity((v) => !v)}
                className={`px-2 py-1 rounded-md text-[10px] border transition-colors ${
                  showLiquidity
                    ? "bg-blue-500/20 text-blue-200 border-blue-500/40"
                    : "bg-secondary/40 text-muted-foreground border-trading-borderColor"
                }`}
              >
                Liquidity {showLiquidity ? "ON" : "OFF"}
              </button>
            </div>
            <CandlestickChart
              candles={candles}
              pair={derivedPair}
              levels={levels}
              liquidityZones={showLiquidity ? liquidityQuery.data?.zones : undefined}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle className="h-2 bg-trading-borderColor/70 hover:bg-trading-gold/40 transition-colors" />
        <ResizablePanel defaultSize={45} minSize={25}>
          <div className="h-full overflow-auto pb-20">
            <SignalTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              trendLineCount={derivedPair.trendLines}
            />
            {renderTabContent()}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
