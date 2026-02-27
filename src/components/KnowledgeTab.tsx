import { useState } from "react";
import { BookOpen, TrendingUp, BarChart3, Layers, Target, ChevronDown } from "lucide-react";

interface Section {
  id: string;
  icon: any;
  title: string;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    id: "candle",
    icon: BarChart3,
    title: "Mô hình nến Nhật",
    content: [
      "• Hammer / Hanging Man: Thân nhỏ, bóng dưới dài ≥2x thân. Hammer ở đáy = tín hiệu tăng, Hanging Man ở đỉnh = tín hiệu giảm.",
      "• Engulfing: Nến sau bao trùm hoàn toàn nến trước. Bullish Engulfing sau xu hướng giảm = mua, Bearish sau tăng = bán.",
      "• Doji: Giá mở = giá đóng, thị trường do dự. Dragonfly Doji (bóng dưới dài) = tăng, Gravestone (bóng trên dài) = giảm.",
      "• Morning Star / Evening Star: Mô hình 3 nến đảo chiều mạnh. Morning Star ở đáy, Evening Star ở đỉnh.",
      "• Three White Soldiers / Three Black Crows: 3 nến cùng hướng liên tiếp, thân lớn = xu hướng mạnh.",
    ],
  },
  {
    id: "sr",
    icon: Layers,
    title: "Hỗ trợ & Kháng cự",
    content: [
      "• Hỗ trợ: Vùng giá mà lực mua mạnh, ngăn giá giảm thêm. Càng nhiều lần test = càng mạnh.",
      "• Kháng cự: Vùng giá mà lực bán mạnh, ngăn giá tăng thêm.",
      "• Khi hỗ trợ bị phá vỡ, nó trở thành kháng cự mới và ngược lại.",
      "• Kết hợp S/R với volume: Volume cao tại vùng S/R = vùng giá quan trọng.",
      "• Round numbers (số tròn) thường là vùng S/R tâm lý: $60,000, $70,000...",
    ],
  },
  {
    id: "pivot",
    icon: Target,
    title: "Pivot Points",
    content: [
      "• PP = (High + Low + Close) / 3 — mức giá trung tâm.",
      "• R1 = 2×PP - Low | R2 = PP + (High - Low) — các mức kháng cự.",
      "• S1 = 2×PP - High | S2 = PP - (High - Low) — các mức hỗ trợ.",
      "• Giá trên PP = xu hướng tăng, dưới PP = xu hướng giảm.",
      "• Dùng R1/S1 cho scalp, R2/S2 cho swing trading.",
    ],
  },
  {
    id: "fibo",
    icon: TrendingUp,
    title: "Fibonacci Retracement",
    content: [
      "• Fibonacci dùng để xác định vùng pullback trong xu hướng.",
      "• Các mức quan trọng: 23.6%, 38.2%, 50%, 61.8%, 78.6%.",
      "• 38.2% - 50%: Pullback nhẹ, xu hướng mạnh.",
      "• 61.8% (Golden Ratio): Vùng pullback quan trọng nhất, thường có phản ứng giá.",
      "• 78.6%: Pullback sâu, cần xác nhận thêm trước khi vào lệnh.",
      "• Kết hợp Fibonacci với S/R và mô hình nến để tăng độ chính xác.",
    ],
  },
  {
    id: "indicator",
    icon: BarChart3,
    title: "Chỉ báo kỹ thuật",
    content: [
      "• RSI (14): >70 = quá mua (cân nhắc bán), <30 = quá bán (cân nhắc mua). Divergence RSI vs giá = tín hiệu mạnh.",
      "• MACD: Khi MACD cắt lên Signal Line = bullish crossover (mua). Cắt xuống = bearish crossunder (bán).",
      "• EMA 20/50: EMA20 cắt lên EMA50 = Golden Cross (tăng). Cắt xuống = Death Cross (giảm).",
      "• ATR: Đo biến động. ATR cao = thị trường biến động mạnh, đặt SL rộng hơn. ATR thấp = ít biến động.",
      "• Volume: Volume tăng xác nhận xu hướng. Volume giảm = xu hướng yếu đi.",
    ],
  },
  {
    id: "risk",
    icon: Target,
    title: "Quản lý rủi ro",
    content: [
      "• Quy tắc 1-2%: Không bao giờ rủi ro quá 1-2% tài khoản cho 1 lệnh.",
      "• Risk:Reward tối thiểu 1:1.5, lý tưởng 1:2 trở lên.",
      "• Luôn đặt Stop Loss trước khi vào lệnh.",
      "• Không all-in, chia nhỏ vị thế (DCA nếu cần).",
      "• Futures: Đòn bẩy x10 = lãi x10 nhưng lỗ cũng x10. Mới bắt đầu nên dùng ≤5x.",
    ],
  },
];

export default function KnowledgeTab() {
  const [expanded, setExpanded] = useState<string | null>("candle");

  return (
    <div className="px-3 py-3 space-y-1.5 animate-fadeIn">
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen className="w-4 h-4 text-trading-gold" />
        <span className="text-[11px] font-bold text-white">Kiến thức Trading</span>
      </div>

      {SECTIONS.map((sec) => {
        const Icon = sec.icon;
        const isOpen = expanded === sec.id;
        return (
          <div key={sec.id} className="bg-secondary/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : sec.id)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-trading-gold" />
                <span className="text-[10px] font-semibold text-white">{sec.title}</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-3 pb-2.5 space-y-1 animate-slideDown">
                {sec.content.map((line, i) => (
                  <p key={i} className="text-[9px] text-muted-foreground leading-relaxed">{line}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
