import { TIMEFRAMES, Timeframe } from "@/data/tradingData";

interface TimeframeSelectorProps {
  selected: Timeframe;
  onSelect: (tf: Timeframe) => void;
}

export default function TimeframeSelector({ selected, onSelect }: TimeframeSelectorProps) {
  return (
    <div className="px-3 py-1.5 border-b border-trading-borderColor overflow-x-auto">
      <div className="flex items-center gap-0.5 min-w-max">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onSelect(tf)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap ${
              selected === tf
                ? "bg-trading-gold text-black shadow-lg shadow-trading-gold/30 scale-105"
                : "text-muted-foreground hover:text-white hover:bg-secondary/50"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}
