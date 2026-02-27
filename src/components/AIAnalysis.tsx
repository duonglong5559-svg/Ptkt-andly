/**
 * AI Phân tích - Huấn luyện từ LLM
 * Module dự kiến tích hợp model LLM để:
 * - Phân tích xu hướng từ dữ liệu kỹ thuật
 * - Đưa ra tín hiệu dựa trên mô hình đã train
 * - Kết hợp pivot chuẩn + thanh khoản + support/resistance cứng
 */

import { useState } from "react";
import { Bot, Brain, Sparkles } from "lucide-react";

interface AIAnalysisProps {
  symbol: string;
  signal: string;
  pivotPrice: number;
  liquidityScore?: number;
  onRequestAnalysis?: () => void;
}

export default function AIAnalysis({
  symbol,
  signal,
  pivotPrice,
  liquidityScore = 0,
  onRequestAnalysis,
}: AIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Placeholder: Gọi LLM API khi tích hợp
    // const res = await fetch('/api/ai/analyze', { body: { symbol, pivotPrice } });
    await new Promise((r) => setTimeout(r, 1500));

    setAnalysisResult(
      `AI phân tích ${symbol}: Pivot ${pivotPrice.toFixed(2)}. Xu hướng ${signal}. ` +
        (liquidityScore > 0 ? `Thanh khoản: ${liquidityScore.toFixed(0)}%. ` : "") +
        "Mô hình sẽ được huấn luyện từ LLM để cải thiện độ chính xác."
    );
    setIsAnalyzing(false);
    onRequestAnalysis?.();
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-1">
            AI Phân tích
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400">LLM</span>
          </h3>
          <p className="text-[10px] text-muted-foreground">Huấn luyện từ mô hình ngôn ngữ</p>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          Module AI sẽ được huấn luyện từ LLM để:
        </p>
        <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
          <li>Phân tích Pivot chuẩn + trend line chính xác</li>
          <li>Chỉ đưa kèo tỉ lệ cao vào phân tích</li>
          <li>Chỉ lấy kháng cự/hỗ trợ cứng (confidence ≥ 85%)</li>
          <li>Tích hợp thanh khoản từ Liquiheart/Coinglass</li>
          <li>Kết hợp sentiment + technical + liquidity</li>
        </ul>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
      >
        {isAnalyzing ? (
          <>
            <Sparkles className="w-4 h-4 animate-pulse" />
            Đang phân tích...
          </>
        ) : (
          <>
            <Bot className="w-4 h-4" />
            Chạy phân tích AI
          </>
        )}
      </button>

      {analysisResult && (
        <div className="bg-secondary/30 rounded-lg p-3 border border-cyan-500/20">
          <p className="text-xs text-cyan-100">{analysisResult}</p>
        </div>
      )}
    </div>
  );
}
