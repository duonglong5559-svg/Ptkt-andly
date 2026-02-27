import { useState, useEffect, useRef } from "react";
import { EntrySignal } from "@/lib/technicalAnalysis";
import { formatPrice } from "@/data/tradingData";
import { TrendingUp, TrendingDown, Zap, DollarSign, AlertTriangle, X, History } from "lucide-react";

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
  openTime: number;
  tp: number;
  sl: number;
}

interface TradeHistory {
  id: number;
  type: "Long" | "Short";
  entry: number;
  exit: number;
  pnl: number;
  leverage: number;
  result: "win" | "loss" | "liquidated";
}

let posId = 0;

export default function FuturesDemo({ signal, currentPrice, symbol }: FuturesDemoProps) {
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  const [leverage, setLeverage] = useState(10);
  const [sizePercent, setSizePercent] = useState(10);
  const [showHistory, setShowHistory] = useState(false);
  const prevPrice = useRef(currentPrice);

  // Check liquidation and TP/SL
  useEffect(() => {
    if (currentPrice === 0 || positions.length === 0) return;

    setPositions((prev) => {
      const remaining: Position[] = [];
      const newHistory: TradeHistory[] = [];

      for (const pos of prev) {
        const diff = pos.type === "Long" ? currentPrice - pos.entry : pos.entry - currentPrice;
        const pnlPct = (diff / pos.entry) * pos.leverage * 100;
        const liqThreshold = -90;

        if (pnlPct <= liqThreshold) {
          newHistory.push({ id: pos.id, type: pos.type, entry: pos.entry, exit: currentPrice, pnl: -pos.size * 0.95, leverage: pos.leverage, result: "liquidated" });
          setBalance((b) => b + pos.size * 0.05);
        } else if (pos.type === "Long" && currentPrice >= pos.tp) {
          const pnl = (pos.tp - pos.entry) / pos.entry * pos.size * pos.leverage;
          newHistory.push({ id: pos.id, type: pos.type, entry: pos.entry, exit: pos.tp, pnl, leverage: pos.leverage, result: "win" });
          setBalance((b) => b + pos.size + pnl);
        } else if (pos.type === "Short" && currentPrice <= pos.tp) {
          const pnl = (pos.entry - pos.tp) / pos.entry * pos.size * pos.leverage;
          newHistory.push({ id: pos.id, type: pos.type, entry: pos.entry, exit: pos.tp, pnl, leverage: pos.leverage, result: "win" });
          setBalance((b) => b + pos.size + pnl);
        } else if (pos.type === "Long" && currentPrice <= pos.sl) {
          const pnl = (pos.sl - pos.entry) / pos.entry * pos.size * pos.leverage;
          newHistory.push({ id: pos.id, type: pos.type, entry: pos.entry, exit: pos.sl, pnl, leverage: pos.leverage, result: "loss" });
          setBalance((b) => b + pos.size + pnl);
        } else if (pos.type === "Short" && currentPrice >= pos.sl) {
          const pnl = (pos.entry - pos.sl) / pos.entry * pos.size * pos.leverage;
          newHistory.push({ id: pos.id, type: pos.type, entry: pos.entry, exit: pos.sl, pnl, leverage: pos.leverage, result: "loss" });
          setBalance((b) => b + pos.size + pnl);
        } else {
          remaining.push(pos);
        }
      }

      if (newHistory.length > 0) setHistory((h) => [...newHistory, ...h].slice(0, 20));
      return remaining;
    });

    prevPrice.current = currentPrice;
  }, [currentPrice, positions]);

  const openPosition = (type: "Long" | "Short") => {
    const size = balance * (sizePercent / 100);
    if (size < 1 || currentPrice === 0) return;

    const atrEst = currentPrice * 0.01;
    const tp = type === "Long" ? currentPrice + atrEst * 2 : currentPrice - atrEst * 2;
    const sl = type === "Long" ? currentPrice - atrEst * 1.2 : currentPrice + atrEst * 1.2;

    setBalance((b) => b - size);
    setPositions((p) => [...p, { id: ++posId, type, entry: currentPrice, leverage, size, openTime: Date.now(), tp, sl }]);
  };

  const closePosition = (pos: Position) => {
    const diff = pos.type === "Long" ? currentPrice - pos.entry : pos.entry - currentPrice;
    const pnl = (diff / pos.entry) * pos.size * pos.leverage;
    setBalance((b) => b + pos.size + pnl);
    setHistory((h) => [{ id: pos.id, type: pos.type, entry: pos.entry, exit: currentPrice, pnl, leverage: pos.leverage, result: pnl >= 0 ? "win" : "loss" }, ...h].slice(0, 20));
    setPositions((p) => p.filter((x) => x.id !== pos.id));
  };

  const totalPnl = positions.reduce((s, pos) => {
    const diff = pos.type === "Long" ? currentPrice - pos.entry : pos.entry - currentPrice;
    return s + (diff / pos.entry) * pos.size * pos.leverage;
  }, 0);

  const winRate = history.length > 0 ? Math.round((history.filter((h) => h.result === "win").length / history.length) * 100) : 0;

  return (
    <div className="px-3 py-2 space-y-2 animate-fadeInUp">
      {/* Balance */}
      <div className="bg-secondary/30 rounded-lg p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-trading-gold" /><span className="text-[10px] font-bold text-white">Futures Demo</span></div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowHistory(!showHistory)} className="text-[8px] text-muted-foreground hover:text-white flex items-center gap-0.5"><History className="w-2.5 h-2.5" />{history.length}</button>
            <span className="text-[8px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">DEMO</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div><div className="text-[7px] text-muted-foreground">Số dư</div><div className="text-[11px] font-bold text-white">${balance.toFixed(0)}</div></div>
          <div><div className="text-[7px] text-muted-foreground">PnL mở</div><div className={`text-[11px] font-bold ${totalPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>{totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}</div></div>
          <div><div className="text-[7px] text-muted-foreground">Vị thế</div><div className="text-[11px] font-bold text-white">{positions.length}</div></div>
          <div><div className="text-[7px] text-muted-foreground">Win Rate</div><div className="text-[11px] font-bold text-trading-gold">{winRate}%</div></div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-secondary/20 rounded-lg p-2.5 space-y-1.5">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="text-[8px] text-muted-foreground mb-0.5">Đòn bẩy</div>
            <div className="flex gap-0.5">
              {[5, 10, 20, 50, 100].map((lv) => (
                <button key={lv} onClick={() => setLeverage(lv)}
                  className={`flex-1 py-0.5 rounded text-[8px] font-bold transition-all ${leverage === lv ? "bg-trading-gold text-black" : "bg-secondary text-muted-foreground"}`}>
                  {lv}x
                </button>
              ))}
            </div>
          </div>
          <div className="w-16">
            <div className="text-[8px] text-muted-foreground mb-0.5">Size</div>
            <div className="flex gap-0.5">
              {[10, 25, 50].map((s) => (
                <button key={s} onClick={() => setSizePercent(s)}
                  className={`flex-1 py-0.5 rounded text-[8px] font-bold transition-all ${sizePercent === s ? "bg-trading-gold text-black" : "bg-secondary text-muted-foreground"}`}>
                  {s}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {signal.type !== "Neutral" && (
          <div className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded ${signal.type === "Long" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            <Zap className="w-2.5 h-2.5" /> AI: {signal.type} | RR: {signal.rr}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => openPosition("Long")} className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-trading-green/20 text-trading-green font-bold text-[10px] hover:bg-trading-green/30 transition-all border border-trading-green/30 active:scale-95">
            <TrendingUp className="w-3 h-3" /> Long / Buy
          </button>
          <button onClick={() => openPosition("Short")} className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-trading-red/20 text-trading-red font-bold text-[10px] hover:bg-trading-red/30 transition-all border border-trading-red/30 active:scale-95">
            <TrendingDown className="w-3 h-3" /> Short / Sell
          </button>
        </div>
      </div>

      {/* Open positions */}
      {positions.map((pos) => {
        const diff = pos.type === "Long" ? currentPrice - pos.entry : pos.entry - currentPrice;
        const pnl = (diff / pos.entry) * pos.size * pos.leverage;
        const pnlPct = (diff / pos.entry) * pos.leverage * 100;
        const liqPrice = pos.type === "Long" ? pos.entry * (1 - 0.9 / pos.leverage) : pos.entry * (1 + 0.9 / pos.leverage);
        return (
          <div key={pos.id} className="bg-secondary/20 rounded-lg p-2 animate-fadeInUp">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${pos.type === "Long" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{pos.type} {pos.leverage}x</span>
                <span className="text-[8px] text-muted-foreground">${formatPrice(pos.entry)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold ${pnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
                </span>
                <button onClick={() => closePosition(pos)} className="p-0.5 hover:bg-secondary rounded"><X className="w-3 h-3 text-muted-foreground" /></button>
              </div>
            </div>
            <div className="flex gap-2 text-[7px] text-muted-foreground">
              <span>TP: <span className="text-green-400">{formatPrice(pos.tp)}</span></span>
              <span>SL: <span className="text-red-400">{formatPrice(pos.sl)}</span></span>
              <span>Liq: <span className="text-orange-400">{formatPrice(liqPrice)}</span></span>
              <span>Size: ${pos.size.toFixed(0)}</span>
            </div>
          </div>
        );
      })}

      {/* Trade history */}
      {showHistory && history.length > 0 && (
        <div className="bg-secondary/20 rounded-lg p-2 space-y-1">
          <div className="text-[9px] font-bold text-white mb-1">Lịch sử giao dịch</div>
          {history.slice(0, 8).map((h) => (
            <div key={h.id} className="flex items-center justify-between text-[8px]">
              <div className="flex items-center gap-1">
                <span className={h.type === "Long" ? "text-green-400" : "text-red-400"}>{h.type} {h.leverage}x</span>
                <span className="text-muted-foreground">{formatPrice(h.entry)} → {formatPrice(h.exit)}</span>
              </div>
              <span className={`font-bold ${h.result === "win" ? "text-green-400" : h.result === "liquidated" ? "text-orange-400" : "text-red-400"}`}>
                {h.result === "liquidated" ? "LIQ" : h.pnl >= 0 ? "+" : ""}{h.pnl.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-[7px] text-muted-foreground/50">
        <AlertTriangle className="w-2 h-2" /> Tài khoản demo — không sử dụng tiền thật
      </div>
    </div>
  );
}
