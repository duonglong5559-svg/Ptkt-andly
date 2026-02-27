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
import FuturesDemo from "@/components/FuturesDemo";
import KnowledgeTab from "@/components/KnowledgeTab";
import { useDrawingTools } from "@/hooks/useDrawingTools";
import { useBinanceData } from "@/hooks/useBinanceData";
import AIChat from "@/components/AIChat";
import LiquidationMap from "@/components/LiquidationMap";
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
  const pairName = TRADING_PAIRS.find((p) => p.symbol === selectedSymbol)?.short || selectedSymbol;

  const tabs = [
    { id: "live", label: "Tín hiệu Live" },
    { id: "analysis", label: "Phân tích" },
    { id: "trendlines", label: `S/R ( ${analysis.srLevels.length} )` },
    { id: "futures", label: "Futures" },
    { id: "ai_chat", label: "AI Chat" },
    { id: "liq", label: "Thanh khoản" },
    { id: "ai", label: "AI ✦" },
    { id: "patterns", label: "Nến" },
    { id: "knowledge", label: "Kiến thức" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "live":
        return (
          <div className="animate-fadeInUp">
            <EntrySignalCard signal={analysis.signal} aiScore={analysis.aiScore} timeframe={timeframe} pairName={pairName} />
            <div className="px-3 py-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-secondary/30 rounded-md p-1.5 text-center">
                  <div className="text-trading-green text-sm font-bold">{analysis.sentiment.bullish}%</div>
                  <div className="text-[7px] text-muted-foreground">Buy Volume</div>
                </div>
                <div className="bg-secondary/30 rounded-md p-1.5 text-center">
                  <div className="text-trading-red text-sm font-bold">{analysis.sentiment.bearish}%</div>
                  <div className="text-[7px] text-muted-foreground">Sell Volume</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "ai":
        return <AIAnalysisPanel score={analysis.aiScore} />;

      case "analysis":
        return (
          <div className="px-3 py-2 space-y-2 animate-fadeInUp">
            <div className="bg-secondary/20 rounded-lg p-2.5">
              <h4 className="text-[9px] font-bold text-trading-gold mb-1.5 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Chỉ báo — {pairName} ({timeframe})
              </h4>
              <div className="space-y-1 text-[9px]">
                {analysis.pivot && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pivot:</span><span className="text-trading-gold">${formatPrice(analysis.pivot.pp)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">R1/R2:</span><span className="text-red-400">${formatPrice(analysis.pivot.r1)} / ${formatPrice(analysis.pivot.r2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">S1/S2:</span><span className="text-green-400">${formatPrice(analysis.pivot.s1)} / ${formatPrice(analysis.pivot.s2)}</span></div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSI (14):</span>
                  <span className={analysis.rsi > 70 ? "text-red-400" : analysis.rsi < 30 ? "text-green-400" : "text-yellow-400"}>
                    {analysis.rsi.toFixed(1)}
                  </span>
                </div>
                {analysis.macd && (
                  <div className="flex justify-between"><span className="text-muted-foreground">MACD:</span><span className={analysis.macd.histogram > 0 ? "text-green-400" : "text-red-400"}>{analysis.macd.crossover ? "Bullish ↑" : analysis.macd.crossunder ? "Bearish ↓" : analysis.macd.histogram > 0 ? "+" : "−"}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">ATR:</span><span className="text-white">{formatPrice(analysis.atr)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Trends:</span><span className="text-purple-400">{analysis.trendLines.length}</span></div>
                {analysis.ticker && <div className="flex justify-between"><span className="text-muted-foreground">Vol 24h:</span><span className="text-white">{formatVolume(analysis.ticker.quoteVolume)}</span></div>}
              </div>
            </div>

            <div className={`rounded-lg p-2.5 border ${analysis.signal.type === "Long" ? "bg-green-500/5 border-green-500/20" : analysis.signal.type === "Short" ? "bg-red-500/5 border-red-500/20" : "bg-yellow-500/5 border-yellow-500/20"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {analysis.signal.type === "Long" ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : analysis.signal.type === "Short" ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> : <Activity className="w-3.5 h-3.5 text-yellow-400" />}
                <span className={`font-bold text-[11px] ${analysis.signal.type === "Long" ? "text-green-400" : analysis.signal.type === "Short" ? "text-red-400" : "text-yellow-400"}`}>
                  {analysis.signal.type} {analysis.signal.confidence}%
                </span>
                <span className="text-[8px] text-muted-foreground ml-auto"><Brain className="w-2.5 h-2.5 inline text-purple-400" /> AI:{analysis.aiScore.overall}</span>
              </div>
              <p className="text-[8px] text-muted-foreground">{analysis.signal.reason}</p>
            </div>
          </div>
        );

      case "trendlines":
        return (
          <div className="animate-fadeIn">
            {resistanceLevels.length === 0 && supportLevels.length === 0 ? (
              <div className="px-4 py-6 text-center"><p className="text-[10px] text-muted-foreground">Đang phân tích...</p></div>
            ) : (
              <>
                {resistanceLevels.map((level, i) => <ResistanceCard key={level.id} level={level} index={i} />)}
                {supportLevels.map((level, i) => <ResistanceCard key={level.id} level={level} index={resistanceLevels.length + i} />)}
              </>
            )}
          </div>
        );

      case "futures":
        return <FuturesDemo signal={analysis.signal} currentPrice={currentPrice} symbol={selectedSymbol} />;

      case "ai_chat":
        return <AIChat aiScore={analysis.aiScore} signal={analysis.signal} pivot={analysis.pivot} rsi={analysis.rsi} atr={analysis.atr} currentPrice={currentPrice} timeframe={timeframe} pairName={pairName} />;

      case "liq":
        return <LiquidationMap candles={analysis.candles} currentPrice={currentPrice} atr={analysis.atr} />;

      case "patterns":
        return <div className="animate-fadeIn"><PatternList patterns={analysis.patterns} /></div>;

      case "knowledge":
        return <KnowledgeTab />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-trading-darkBg text-white max-w-screen-sm mx-auto relative select-none" onClick={() => showPairSelector && setShowPairSelector(false)}>
      <MarqueeTicker aiScore={analysis.aiScore} signal={analysis.signal} currentSymbol={selectedSymbol} />
      <TradingHeader
        selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol}
        ticker={analysis.ticker} signal={analysis.signal}
        showPairSelector={showPairSelector} onTogglePairSelector={() => setShowPairSelector((p) => !p)}
        isConnected={!analysis.error} lastUpdate={analysis.lastUpdate}
      />
      <SentimentBar bullish={analysis.sentiment.bullish} bearish={analysis.sentiment.bearish} />
      <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />

      {analysis.loading && analysis.candles.length === 0 ? (
        <div className="h-[380px] flex items-center justify-center border-b border-trading-borderColor">
          <div className="flex flex-col items-center gap-2 animate-fadeIn">
            <Loader2 className="w-5 h-5 text-trading-gold animate-spin" />
            <span className="text-[10px] text-muted-foreground">Đang tải từ Binance...</span>
          </div>
        </div>
      ) : analysis.error && analysis.candles.length === 0 ? (
        <div className="h-[380px] flex items-center justify-center border-b border-trading-borderColor">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-red-400">{analysis.error}</span>
            <button onClick={() => window.location.reload()} className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-white"><RefreshCw className="w-3 h-3" /> Thử lại</button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {analysis.pivot && (
            <div className="absolute top-1 left-8 z-10 text-[8px] text-muted-foreground/70">
              {formatPrice(currentPrice)} | {currentPrice > analysis.pivot.pp ? `▲ Trên PP (${formatPrice(analysis.pivot.pp)})` : `▼ Dưới PP (${formatPrice(analysis.pivot.pp)})`}
            </div>
          )}
          {analysis.loading && analysis.candles.length > 0 && (
            <div className="absolute top-1 right-20 z-10"><RefreshCw className="w-2.5 h-2.5 text-trading-gold animate-spin" /></div>
          )}
          <DrawingToolbar
            activeTool={drawingTools.activeTool} onSelectTool={drawingTools.setActiveTool}
            selectedColor={drawingTools.selectedColor} onSelectColor={drawingTools.setSelectedColor}
            onClearAll={drawingTools.clearAllDrawings} onUndo={drawingTools.undoLast}
            drawingCount={drawingTools.drawings.length}
          />
          <CandlestickChart
            candles={analysis.candles} currentPrice={currentPrice}
            pivot={analysis.pivot} srLevels={analysis.srLevels} atr={analysis.atr}
            trendLines={analysis.trendLines} entryMarkers={analysis.entryMarkers}
            activeTool={drawingTools.activeTool} drawings={drawingTools.drawings}
            activeDrawing={drawingTools.activeDrawing}
            onStartDrawing={drawingTools.startDrawing} onUpdateDrawing={drawingTools.updateDrawing}
            onFinishDrawing={drawingTools.finishDrawing} onRemoveDrawing={drawingTools.removeDrawing}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-trading-borderColor">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-2 text-[9px] font-semibold whitespace-nowrap transition-all relative ${activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-white"}`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-trading-gold rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-16">{renderTabContent()}</div>
    </div>
  );
}
