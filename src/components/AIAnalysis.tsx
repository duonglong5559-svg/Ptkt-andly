import { useState, useEffect, useRef } from "react";
import { TradingPair, TechnicalIndicators, CandleData } from "@/data/tradingData";
import { Bot, Send, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AIAnalysisProps {
  pair: TradingPair;
  indicators: TechnicalIndicators;
  candles: CandleData[];
}

interface Message {
  role: "assistant" | "user";
  content: string;
  isTyping?: boolean;
}

function generateAIAnalysis(pair: TradingPair, ind: TechnicalIndicators): string {
  const direction = ind.probability > 60 ? "tăng" : ind.probability < 40 ? "giảm" : "sideway";
  const signal = pair.signal === "Long" ? "MUA" : pair.signal === "Short" ? "BÁN" : "CHỜ";

  const lines = [
    `📊 **Phân tích AI cho ${pair.symbol}** (${pair.category === "forex" ? "Forex" : "Crypto"})`,
    "",
    `🎯 **Tín hiệu: ${signal}** | Xác suất: ${ind.probability}%`,
    "",
    `**Xu hướng chính:** ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
    `- RSI(14): ${ind.rsi} → ${ind.rsiSignal}`,
    `- MACD: ${ind.macdSignal} (H: ${ind.macd.histogram > 0 ? "+" : ""}${ind.macd.histogram})`,
    `- EMA 20/50: ${ind.emaCross}`,
    `- ATR: ${ind.atr} (${ind.atr > pair.currentPrice * 0.015 ? "Biến động cao" : "Biến động thấp"})`,
    "",
    `**Pivot Points (Chuẩn):**`,
    `- R3: ${ind.pivotPoints.r3.toFixed(pair.decimals)} | R2: ${ind.pivotPoints.r2.toFixed(pair.decimals)} | R1: ${ind.pivotPoints.r1.toFixed(pair.decimals)}`,
    `- Pivot: ${ind.pivotPoints.pivot.toFixed(pair.decimals)}`,
    `- S1: ${ind.pivotPoints.s1.toFixed(pair.decimals)} | S2: ${ind.pivotPoints.s2.toFixed(pair.decimals)} | S3: ${ind.pivotPoints.s3.toFixed(pair.decimals)}`,
    "",
    `**Khuyến nghị:**`,
  ];

  if (ind.probability > 65) {
    lines.push(
      `✅ Kèo tỉ lệ cao — ${pair.signal === "Long" ? "LONG" : "SHORT"} với RR tối thiểu 1:1.5`,
      `- Entry: ${pair.buyPrice.toFixed(pair.decimals)}`,
      `- TP1: ${(pair.signal === "Long" ? ind.pivotPoints.r1 : ind.pivotPoints.s1).toFixed(pair.decimals)}`,
      `- TP2: ${(pair.signal === "Long" ? ind.pivotPoints.r2 : ind.pivotPoints.s2).toFixed(pair.decimals)}`,
      `- SL: ${(pair.signal === "Long" ? ind.pivotPoints.s1 : ind.pivotPoints.r1).toFixed(pair.decimals)}`,
    );
  } else if (ind.probability > 50) {
    lines.push(
      `⚠️ Tín hiệu trung bình — Chờ xác nhận thêm từ volume và price action`,
      `- Chỉ vào lệnh khi giá test lại vùng hỗ trợ/kháng cự cứng`,
    );
  } else {
    lines.push(
      `❌ Xác suất thấp — Không khuyến nghị vào lệnh`,
      `- Chờ tín hiệu rõ ràng hơn từ MACD và RSI`,
    );
  }

  lines.push("", `⏰ Phân tích lúc ${new Date().toLocaleTimeString("vi-VN")} | Dữ liệu ${pair.category === "forex" ? "sàn Forex" : "real-time"}`);

  return lines.join("\n");
}

function generateQuickAnswer(question: string, pair: TradingPair, ind: TechnicalIndicators): string {
  const q = question.toLowerCase();
  if (q.includes("mua") || q.includes("long") || q.includes("buy")) {
    if (ind.probability > 60) {
      return `Hiện tại ${pair.symbol} có tín hiệu ${pair.signal} với xác suất ${ind.probability}%. RSI ở ${ind.rsi} (${ind.rsiSignal}), MACD ${ind.macdSignal}. Khuyến nghị LONG nếu giá giữ trên Pivot ${ind.pivotPoints.pivot.toFixed(pair.decimals)}.`;
    }
    return `Tín hiệu chưa rõ ràng cho ${pair.symbol}. Xác suất chỉ ${ind.probability}%. Nên chờ thêm xác nhận.`;
  }
  if (q.includes("bán") || q.includes("short") || q.includes("sell")) {
    return `${pair.symbol}: RSI ${ind.rsi}, MACD ${ind.macdSignal}. ${ind.probability < 40 ? "Có thể SHORT với SL tại " + ind.pivotPoints.r1.toFixed(pair.decimals) : "Chưa đủ điều kiện SHORT."}`;
  }
  if (q.includes("pivot") || q.includes("hỗ trợ") || q.includes("kháng cự")) {
    return `Pivot Points cho ${pair.symbol}:\n- Pivot: ${ind.pivotPoints.pivot.toFixed(pair.decimals)}\n- R1: ${ind.pivotPoints.r1.toFixed(pair.decimals)} | R2: ${ind.pivotPoints.r2.toFixed(pair.decimals)}\n- S1: ${ind.pivotPoints.s1.toFixed(pair.decimals)} | S2: ${ind.pivotPoints.s2.toFixed(pair.decimals)}\n\nChỉ lấy vùng kháng cự/hỗ trợ cứng (đã test >= 3 lần).`;
  }
  if (q.includes("rsi")) {
    return `RSI(14) hiện tại: ${ind.rsi} — ${ind.rsiSignal}. ${ind.rsi > 70 ? "Đang quá mua, cẩn thận điều chỉnh." : ind.rsi < 30 ? "Đang quá bán, có thể phục hồi." : "Vùng trung tính."}`;
  }
  return `Phân tích ${pair.symbol}: Giá ${pair.currentPrice.toFixed(pair.decimals)}, RSI ${ind.rsi} (${ind.rsiSignal}), MACD ${ind.macdSignal}, Pivot ${ind.pivotPoints.pivot.toFixed(pair.decimals)}. Xác suất tăng: ${ind.probability}%.`;
}

export default function AIAnalysis({ pair, indicators, candles }: AIAnalysisProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setIsGenerating(true);

    const analysis = generateAIAnalysis(pair, indicators);
    const msg: Message = { role: "assistant", content: "", isTyping: true };
    setMessages([msg]);

    let idx = 0;
    const interval = setInterval(() => {
      idx += Math.floor(Math.random() * 3) + 2;
      if (idx >= analysis.length) {
        setMessages([{ role: "assistant", content: analysis }]);
        setIsGenerating(false);
        clearInterval(interval);
      } else {
        setMessages([{ role: "assistant", content: analysis.slice(0, idx), isTyping: true }]);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [pair, indicators]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    const answer = generateQuickAnswer(input, pair, indicators);
    setTimeout(() => {
      const aiMsg: Message = { role: "assistant", content: "", isTyping: true };
      setMessages((prev) => [...prev, aiMsg]);

      let idx = 0;
      const interval = setInterval(() => {
        idx += Math.floor(Math.random() * 3) + 2;
        if (idx >= answer.length) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: answer };
            return updated;
          });
          setIsGenerating(false);
          clearInterval(interval);
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: answer.slice(0, idx), isTyping: true };
            return updated;
          });
        }
      }, 20);
    }, 500);
  };

  const SignalIcon = pair.signal === "Long" ? TrendingUp : pair.signal === "Short" ? TrendingDown : Minus;
  const signalColor = pair.signal === "Long" ? "text-trading-green" : pair.signal === "Short" ? "text-trading-red" : "text-yellow-400";

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white">AI Trading Assistant</span>
            <Sparkles className="w-3 h-3 text-purple-400" />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>LLM-powered</span>
            <span>·</span>
            <SignalIcon className={`w-3 h-3 ${signalColor}`} />
            <span className={signalColor}>{pair.signal}</span>
            <span>·</span>
            <span>{indicators.probability}% xác suất</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[400px] overflow-y-auto space-y-3 mb-3 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-blue-600/20 text-blue-200 border border-blue-500/30"
                : "bg-secondary/40 text-muted-foreground border border-trading-borderColor"
            }`}>
              {msg.content.split("\n").map((line, j) => (
                <div key={j}>
                  {line.replace(/\*\*(.*?)\*\*/g, "").includes("**") ? line : line.replace(/\*\*(.*?)\*\*/g, (_, text) => text)}
                  {line === "" && <br />}
                </div>
              ))}
              {msg.isTyping && <span className="inline-block w-1.5 h-3 bg-purple-400 animate-pulse ml-0.5" />}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Hỏi AI về tín hiệu, pivot, RSI..."
          className="flex-1 bg-secondary/40 border border-trading-borderColor rounded-lg px-3 py-2 text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/50"
          disabled={isGenerating}
        />
        <button
          onClick={handleSend}
          disabled={isGenerating || !input.trim()}
          className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 flex items-center justify-center transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      <div className="flex gap-1.5 mt-2 flex-wrap">
        {["Nên mua không?", "Pivot points?", "RSI bao nhiêu?", "Kháng cự cứng?"].map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            className="px-2 py-1 rounded-md bg-secondary/30 border border-trading-borderColor text-[10px] text-muted-foreground hover:text-white hover:border-purple-500/30 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
