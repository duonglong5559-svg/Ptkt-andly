import { useState } from "react";
import TradingHeader from "@/components/TradingHeader";
import SentimentBar from "@/components/SentimentBar";
import TimeframeSelector from "@/components/TimeframeSelector";
import CandlestickChart from "@/components/CandlestickChart";
import ResistanceCard from "@/components/ResistanceCard";
import EntrySignalCard from "@/components/EntrySignalCard";
import PatternList from "@/components/PatternList";
import MarqueeTicker from "@/components/MarqueeTicker";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";
import DrawingToolbar from "@/components/DrawingToolbar";
import { useDrawingTools } from "@/hooks/useDrawingTools";
import { useBinanceData } from "@/hooks/useBinanceData";
import { TRADING_PAIRS } from "@/lib/binanceApi";
import { formatPrice, formatVolume, Timeframe } from "@/data/tradingData";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Activity, Brain } from "lucide-react";

export default function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState(TRADING_PAIRS[0].symbol);
  const [timeframe, setTimeframe] = useState<Timeframe>("4H");
  const [activeTab, setActiveTab] = useState("trendlines");
  const [showPairSelector, setShowPairSelector] = useState(false);

  const drawingTools = useDrawingTools();
  const analysis = useBinanceData(selectedSymbol, timeframe);
  const currentPrice = analysis.ticker?.lastPrice || analysis.candles[analysis.candles.length - 1]?.close || 0;

  const resistanceLevels = analysis.srLevels.filter((l) => l.type === "resistance");
  const supportLevels = analysis.srLevels.filter((l) => l.type === "support");

  const tabs = [
    { id: "live", label: "Tín hiệu Live" },
    { id: "ai", label: "AI Phân tích" },
    { id: "analysis", label: "Kỹ thuật" },
    { id: "trendlines", label: "Hỗ trợ/KC" },
    { id: "patterns", label: "Mô hình nến" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "live":
        return (
          <div className="animate-fadeInUp">
            <EntrySignalCard signal={analysis.signal} />
            <div className="px-3 py-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                  <div className="text-trading-green text-lg font-bold">{analysis.sentiment.bullish}%</div>
                  <div className="text-[9px] text-muted-foreground">Bullish Volume</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                  <div className="text-trading-red text-lg font-bold">{analysis.sentiment.bearish}%</div>
                  <div className="text-[9px] text-muted-foreground">Bearish Volume</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "ai":
        return <AIAnalysisPanel score={analysis.aiScore} />;

      case "analysis":
        return (
          <div className="px-3 py-3 space-y-2 animate-fadeInUp">
            <div className="bg-secondary/20 rounded-lg p-3">
              <h4 className="text-[10px] font-bold text-trading-gold mb-2 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Chỉ báo kỹ thuật
              </h4>
              <div className="space-y-1.5 text-[10px]">
                {analysis.pivot && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pivot Point:</span>
                      <span className="text-trading-gold font-medium">${formatPrice(analysis.pivot.pp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kháng cự R1 / R2:</span>
                      <span className="text-red-400">${formatPrice(analysis.pivot.r1)} / ${formatPrice(analysis.pivot.r2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hỗ trợ S1 / S2:</span>
                      <span className="text-green-400">${formatPrice(analysis.pivot.s1)} / ${formatPrice(analysis.pivot.s2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSI (14):</span>
                  <span className={analysis.rsi > 70 ? "text-red-400" : analysis.rsi < 30 ? "text-green-400" : "text-yellow-400"}>
                    {analysis.rsi.toFixed(1)} - {analysis.rsi > 70 ? "Quá mua" : analysis.rsi < 30 ? "Quá bán" : "Trung tính"}
                  </span>
                </div>
                {analysis.macd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MACD:</span>
                    <span className={analysis.macd.histogram > 0 ? "text-green-400" : "text-red-400"}>
                      {analysis.macd.crossover ? "Bullish crossover ↑" : analysis.macd.crossunder ? "Bearish crossunder ↓" : analysis.macd.histogram > 0 ? "Tích cực" : "Tiêu cực"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ATR:</span>
                  <span className="text-white">{formatPrice(analysis.atr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trend Lines:</span>
                  <span className="text-purple-400">{analysis.trendLines.length} detected</span>
                </div>
                {analysis.ticker && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume 24h:</span>
                    <span className="text-white">{formatVolume(analysis.ticker.quoteVolume)} USDT</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-lg p-3 border ${analysis.signal.type === "Long" ? "bg-green-500/5 border-green-500/20" : analysis.signal.type === "Short" ? "bg-red-500/5 border-red-500/20" : "bg-yellow-500/5 border-yellow-500/20"}`}>
              <h4 className="text-[10px] font-bold text-white mb-2">Tổng kết</h4>
              <div className="flex items-center gap-2 mb-1">
                {analysis.signal.type === "Long" ? <TrendingUp className="w-4 h-4 text-green-400" /> : analysis.signal.type === "Short" ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Activity className="w-4 h-4 text-yellow-400" />}
                <span className={`font-bold text-sm ${analysis.signal.type === "Long" ? "text-green-400" : analysis.signal.type === "Short" ? "text-red-400" : "text-yellow-400"}`}>
                  {analysis.signal.type} - {analysis.signal.confidence}%
                </span>
                <span className="text-[9px] text-muted-foreground ml-auto flex items-center gap-1">
                  <Brain className="w-3 h-3 text-purple-400" /> AI: {analysis.aiScore.overall}/100
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground leading-relaxed">{analysis.signal.reason}</p>
            </div>
          </div>
        );

      case "trendlines":
        return (
          <div className="animate-fadeIn">
            {resistanceLevels.length === 0 && supportLevels.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">Đang phân tích dữ liệu...</p>
              </div>
            ) : (
              <>
                {resistanceLevels.map((level, i) => (
                  <ResistanceCard key={level.id} level={level} index={i} />
                ))}
                {supportLevels.map((level, i) => (
                  <ResistanceCard key={level.id} level={level} index={resistanceLevels.length + i} />
                ))}
              </>
            )}
          </div>
        );

      case "patterns":
        return (
          <div className="animate-fadeIn">
            <PatternList patterns={analysis.patterns} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-trading-darkBg text-white max-w-lg mx-auto relative"
      onClick={() => showPairSelector && setShowPairSelector(false)}
    >
      {/* Scrolling marquee */}
      <MarqueeTicker
        aiScore={analysis.aiScore}
        signal={analysis.signal}
        currentSymbol={selectedSymbol}
      />

      <TradingHeader
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        ticker={analysis.ticker}
        signal={analysis.signal}
        showPairSelector={showPairSelector}
        onTogglePairSelector={() => setShowPairSelector((p) => !p)}
        isConnected={!analysis.error}
        lastUpdate={analysis.lastUpdate}
      />

      <SentimentBar bullish={analysis.sentiment.bullish} bearish={analysis.sentiment.bearish} />
      <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

      {/* Chart */}
      {analysis.loading && analysis.candles.length === 0 ? (
        <div className="h-[360px] flex items-center justify-center border-b border-trading-borderColor">
          <div className="flex flex-col items-center gap-2 animate-fadeIn">
            <Loader2 className="w-6 h-6 text-trading-gold animate-spin" />
            <span className="text-xs text-muted-foreground">Đang tải dữ liệu từ Binance...</span>
          </div>
        </div>
      ) : analysis.error && analysis.candles.length === 0 ? (
        <div className="h-[360px] flex items-center justify-center border-b border-trading-borderColor">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-red-400">{analysis.error}</span>
            <button onClick={() => window.location.reload()} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white transition-colors">
              <RefreshCw className="w-3 h-3" /> Thử lại
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {analysis.pivot && (
            <div className="absolute top-1 left-2 z-10 text-[9px] text-muted-foreground/80 animate-fadeIn">
              Giá tại {formatPrice(currentPrice)}.{" "}
              {currentPrice > analysis.pivot.pp
                ? `Trên Pivot (${formatPrice(analysis.pivot.pp)}), xu hướng tăng`
                : `Dưới Pivot (${formatPrice(analysis.pivot.pp)}), xu hướng giảm`}
            </div>
          )}
          {analysis.loading && analysis.candles.length > 0 && (
            <div className="absolute top-1 right-20 z-10">
              <RefreshCw className="w-3 h-3 text-trading-gold animate-spin" />
            </div>
          )}
          {/* Drawing toolbar */}
          <DrawingToolbar
            activeTool={drawingTools.activeTool}
            onSelectTool={drawingTools.setActiveTool}
            selectedColor={drawingTools.selectedColor}
            onSelectColor={drawingTools.setSelectedColor}
            onClearAll={drawingTools.clearAllDrawings}
            onUndo={drawingTools.undoLast}
            drawingCount={drawingTools.drawings.length}
          />
          <CandlestickChart
            candles={analysis.candles}
            currentPrice={currentPrice}
            pivot={analysis.pivot}
            srLevels={analysis.srLevels}
            atr={analysis.atr}
            trendLines={analysis.trendLines}
            entryMarkers={analysis.entryMarkers}
            activeTool={drawingTools.activeTool}
            drawings={drawingTools.drawings}
            activeDrawing={drawingTools.activeDrawing}
            onStartDrawing={drawingTools.startDrawing}
            onUpdateDrawing={drawingTools.updateDrawing}
            onFinishDrawing={drawingTools.finishDrawing}
            onRemoveDrawing={drawingTools.removeDrawing}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-trading-borderColor">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-[10px] font-semibold whitespace-nowrap transition-all relative ${
                activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab.label}
              {tab.id === "trendlines" && <span className="ml-0.5 text-trading-gold">({analysis.srLevels.length})</span>}
              {tab.id === "ai" && <span className="ml-0.5 text-purple-400">✦</span>}
              {activeTab === tab.id && <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-trading-gold rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-20">{renderTabContent()}</div>
    </div>
  );
}
