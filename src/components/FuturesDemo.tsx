import { useState } from "react";
import { EntrySignal } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";
import { TrendingUp, TrendingDown, Zap, DollarSign, AlertTriangle } from "lucide-react";

interface FuturesDemoProps {
  signal: EntrySignal;
  currentPrice: number;
  symbol: string;
}

interface Position {
  id: number;
  type: "Long" | "Short";
  entry: number;
  leverage: number;
  size: number;
  pnl: number;
  pnlPct: number;
}

let posId = 0;

export default function FuturesDemo({ signal, currentPrice, symbol }: FuturesDemoProps) {
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [leverage, setLeverage] = useState(10);
  const [sizePercent, setSizePercent] = useState(10);

  const openPosition = (type: "Long" | "Short") => {
    const size = balance * (sizePercent / 100);
    if (size < 1) return;
    setBalance((b) => b - size);
    setPositions((p) => [
      ...p,
      { id: ++posId, type, entry: currentPrice, leverage, size, pnl: 0, pnlPct: 0 },
    ]);
  };

  const closePosition = (pos: Position) => {
    const diff = pos.type === "Long" ? currentPrice - pos.entry : pos.entry - currentPrice;
    const pnl = (diff / pos.entry) * pos.size * pos.leverage;
    setBalance((b) => b + pos.size + pnl);
    setPositions((p) => p.filter((x) => x.id !== pos.id));
  };

  const updatedPositions = positions.map((pos) => {
    const diff = pos.type === "Long" ? currentPrice - pos.entry : pos.entry - currentPrice;
    const pnl = (diff / pos.entry) * pos.size * pos.leverage;
    const pnlPct = (diff / pos.entry) * pos.leverage * 100;
    return { ...pos, pnl, pnlPct };
  });

  const totalPnl = updatedPositions.reduce((s, p) => s + p.pnl, 0);

  return (
    <div className="px-3 py-3 space-y-3 animate-fadeInUp">
      {/* Balance */}
      <div className="bg-secondary/30 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-trading-gold" />
            <span className="text-[11px] font-bold text-white">Futures Demo Account</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">DEMO</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[9px] text-muted-foreground">Số dư</div>
            <div className="text-sm font-bold text-white">${formatPrice(balance)}</div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground">PnL mở</div>
            <div className={`text-sm font-bold ${totalPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
              {totalPnl >= 0 ? "+" : ""}{formatPrice(totalPnl)}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground">Vị thế</div>
            <div className="text-sm font-bold text-white">{updatedPositions.length}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-secondary/20 rounded-xl p-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="text-[9px] text-muted-foreground mb-1">Đòn bẩy</div>
            <div className="flex gap-1">
              {[5, 10, 20, 50, 100].map((lv) => (
                <button
                  key={lv}
                  onClick={() => setLeverage(lv)}
                  className={`flex-1 py-1 rounded text-[9px] font-bold transition-all ${
                    leverage === lv ? "bg-trading-gold text-black" : "bg-secondary text-muted-foreground hover:text-white"
                  }`}
                >
                  {lv}x
                </button>
              ))}
            </div>
          </div>
          <div className="w-20">
            <div className="text-[9px] text-muted-foreground mb-1">Size %</div>
            <div className="flex gap-1">
              {[10, 25, 50].map((s) => (
                <button
                  key={s}
                  onClick={() => setSizePercent(s)}
                  className={`flex-1 py-1 rounded text-[9px] font-bold transition-all ${
                    sizePercent === s ? "bg-trading-gold text-black" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI suggestion */}
        {signal.type !== "Neutral" && (
          <div className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg ${signal.type === "Long" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            <Zap className="w-3 h-3" />
            AI đề xuất: {signal.type} | Entry: ${formatPrice(signal.entry)} | RR: {signal.rr}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openPosition("Long")}
            className="flex items-center justify-center gap-1 py-2 rounded-lg bg-trading-green/20 text-trading-green font-bold text-xs hover:bg-trading-green/30 transition-all border border-trading-green/30"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Long
          </button>
          <button
            onClick={() => openPosition("Short")}
            className="flex items-center justify-center gap-1 py-2 rounded-lg bg-trading-red/20 text-trading-red font-bold text-xs hover:bg-trading-red/30 transition-all border border-trading-red/30"
          >
            <TrendingDown className="w-3.5 h-3.5" /> Short
          </button>
        </div>
      </div>

      {/* Open positions */}
      {updatedPositions.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-white">Vị thế đang mở</div>
          {updatedPositions.map((pos) => (
            <div key={pos.id} className="bg-secondary/20 rounded-lg p-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold ${pos.type === "Long" ? "text-trading-green" : "text-trading-red"}`}>
                    {pos.type} {pos.leverage}x
                  </span>
                  <span className="text-[9px] text-muted-foreground">${formatPrice(pos.entry)}</span>
                </div>
                <div className="text-[9px] text-muted-foreground">Size: ${formatPrice(pos.size)}</div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-bold ${pos.pnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                  {pos.pnl >= 0 ? "+" : ""}{formatPrice(pos.pnl)} ({pos.pnlPct.toFixed(1)}%)
                </div>
                <button
                  onClick={() => closePosition(pos)}
                  className="text-[9px] text-muted-foreground hover:text-white underline"
                >
                  Đóng lệnh
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-[8px] text-muted-foreground/60">
        <AlertTriangle className="w-2.5 h-2.5" />
        Đây là tài khoản demo, không sử dụng tiền thật
      </div>
    </div>
  );
}
