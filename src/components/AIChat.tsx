import { useState, useRef, useEffect } from "react";
import { Brain, Send, Loader2, Sparkles } from "lucide-react";
import { AIAnalysisScore, EntrySignal, PivotPoints } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";

interface AIChatProps {
  aiScore: AIAnalysisScore;
  signal: EntrySignal;
  pivot: PivotPoints | null;
  rsi: number;
  atr: number;
  currentPrice: number;
  timeframe: string;
  pairName: string;
}

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

let msgId = 0;

function generateAIResponse(
  question: string,
  ctx: AIChatProps,
): string {
  const q = question.toLowerCase();
  const { signal, aiScore, pivot, rsi, atr, currentPrice, timeframe, pairName } = ctx;

  if (q.includes("entry") || q.includes("vào lệnh") || q.includes("lệnh")) {
    if (signal.type === "Neutral") return `🤖 Hiện tại AI chưa thấy setup rõ ràng cho ${pairName} trên khung ${timeframe}. Nên chờ thêm xác nhận.\n\nĐiểm AI: ${aiScore.overall}/100\nRSI: ${rsi.toFixed(1)}`;
    return `🤖 AI đề xuất **${signal.type}** cho ${pairName} (${timeframe}):\n\n📍 Entry: $${formatPrice(signal.entry)}\n🎯 TP1 Scalp: $${formatPrice(signal.tp1)}\n🎯 TP2 Swing: $${formatPrice(signal.tp2)}\n🛑 Stop Loss: $${formatPrice(signal.sl)}\n📊 RR: ${signal.rr}\n🧠 AI Score: ${aiScore.overall}/100\n\nLý do: ${signal.reason}`;
  }

  if (q.includes("pivot") || q.includes("pp")) {
    if (!pivot) return "Chưa đủ dữ liệu để tính Pivot.";
    return `📊 Pivot Points cho ${pairName} (${timeframe}):\n\n🔴 R3: $${formatPrice(pivot.r3)}\n🔴 R2: $${formatPrice(pivot.r2)}\n🔴 R1: $${formatPrice(pivot.r1)}\n🟡 PP: $${formatPrice(pivot.pp)}\n🟢 S1: $${formatPrice(pivot.s1)}\n🟢 S2: $${formatPrice(pivot.s2)}\n🟢 S3: $${formatPrice(pivot.s3)}\n\nGiá hiện tại $${formatPrice(currentPrice)} ${currentPrice > pivot.pp ? "trên PP → xu hướng tăng" : "dưới PP → xu hướng giảm"}`;
  }

  if (q.includes("rsi")) {
    const status = rsi > 70 ? "QUÁ MUA — cân nhắc chốt lời hoặc short" : rsi < 30 ? "QUÁ BÁN — cơ hội mua" : "Trung tính";
    return `📈 RSI (14) = ${rsi.toFixed(1)}\n\nTrạng thái: ${status}\n\n💡 RSI > 70: Quá mua, giá có thể điều chỉnh\nRSI < 30: Quá bán, giá có thể phục hồi\nRSI 40-60: Vùng trung tính, chờ tín hiệu`;
  }

  if (q.includes("atr") || q.includes("biến động")) {
    const atrPct = (atr / currentPrice) * 100;
    return `📊 ATR = ${formatPrice(atr)} (${atrPct.toFixed(2)}% giá)\n\n${atrPct > 2 ? "⚡ Biến động CAO — SL rộng hơn, TP xa hơn" : atrPct > 1 ? "📊 Biến động TRUNG BÌNH" : "😴 Biến động THẤP — thị trường sideway"}\n\n💡 Dùng ATR để:\n• Đặt SL: Entry ± 1.5×ATR\n• Đặt TP: Entry ± 2-3×ATR`;
  }

  if (q.includes("trend") || q.includes("xu hướng")) {
    return `📈 Phân tích xu hướng ${pairName} (${timeframe}):\n\n${aiScore.trendScore >= 60 ? "✅ Xu hướng TĂNG" : aiScore.trendScore <= 40 ? "📉 Xu hướng GIẢM" : "↔️ Sideway"}\n\nĐiểm xu hướng: ${aiScore.trendScore}/100\nĐiểm momentum: ${aiScore.momentumScore}/100\n\n${aiScore.details.slice(0, 4).map((d) => `• ${d}`).join("\n")}`;
  }

  if (q.includes("risk") || q.includes("rủi ro") || q.includes("quản lý")) {
    return `🛡 Quản lý rủi ro:\n\n1. **Quy tắc 1-2%**: Không rủi ro quá 1-2% tài khoản/lệnh\n2. **Risk:Reward ≥ 1:1.5**: Chỉ vào lệnh khi RR tốt\n3. **Luôn đặt SL**: Trước khi vào lệnh\n4. **Leverage thấp**: Mới chơi ≤ 5x\n\nVới balance $10,000:\n• Rủi ro 1% = $100/lệnh\n• SL 1% giá = leverage 1x\n• SL 0.5% giá + leverage 2x = rủi ro 1%`;
  }

  if (q.includes("help") || q.includes("giúp") || q.includes("gì")) {
    return `🤖 Tôi có thể giúp bạn:\n\n📍 **"vào lệnh"** — AI phân tích entry\n📊 **"pivot"** — Pivot Points hiện tại\n📈 **"rsi"** — Chỉ báo RSI\n📉 **"trend"** — Phân tích xu hướng\n💰 **"risk"** — Quản lý rủi ro\n📊 **"atr"** — Biến động ATR\n\nHãy hỏi bất cứ điều gì về ${pairName}!`;
  }

  return `🤖 Phân tích nhanh ${pairName} (${timeframe}):\n\n• AI Score: ${aiScore.overall}/100 — ${aiScore.verdict}\n• Signal: ${signal.type} (${signal.confidence}%)\n• RSI: ${rsi.toFixed(1)}\n• Giá: $${formatPrice(currentPrice)}\n\n💡 Gõ "vào lệnh" để xem entry chi tiết, hoặc "help" để xem các lệnh khác.`;
}

export default function AIChat(props: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "ai", text: `🤖 Xin chào! Tôi là AI Trading Assistant.\n\nĐang theo dõi ${props.pairName} trên khung ${props.timeframe}.\nAI Score: ${props.aiScore.overall}/100\n\nHỏi tôi: "vào lệnh", "pivot", "rsi", "trend", "risk" hoặc bất cứ điều gì!` },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: ++msgId, role: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(userMsg.text, props);
      setMessages((m) => [...m, { id: ++msgId, role: "ai", text: response }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <div className="flex flex-col h-[360px] animate-fadeIn">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[9px] leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-blue-600/30 text-white" : "bg-secondary/40 text-muted-foreground"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary/40 rounded-lg px-3 py-2 flex items-center gap-1">
              <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
              <span className="text-[8px] text-muted-foreground">Đang phân tích...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-3 py-1 flex gap-1 overflow-x-auto">
        {["Vào lệnh", "Pivot", "RSI", "Trend", "Risk"].map((q) => (
          <button key={q} onClick={() => { setInput(q); }}
            className="px-2 py-0.5 rounded-full bg-secondary/40 text-[8px] text-muted-foreground hover:text-white whitespace-nowrap flex items-center gap-0.5 transition-all">
            <Sparkles className="w-2 h-2" />{q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-trading-borderColor flex gap-1.5">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Hỏi AI về trading..."
          className="flex-1 bg-secondary/30 border border-trading-borderColor rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-muted-foreground outline-none focus:border-purple-500/50"
        />
        <button onClick={sendMessage} disabled={!input.trim()}
          className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 disabled:opacity-30 transition-all">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
