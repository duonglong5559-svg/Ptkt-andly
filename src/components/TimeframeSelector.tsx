import { timeframes, Timeframe } from "@/data/tradingData";

interface TimeframeSelectorProps {
  selected: Timeframe;
  onSelect: (tf: Timeframe) => void;
}

export default function TimeframeSelector({ selected, onSelect }: TimeframeSelectorProps) {
  return (
    <div className="px-4 py-2 border-b border-trading-borderColor">
      <div className="flex items-center gap-1 overflow-x-auto">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onSelect(tf)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              selected === tf
                ? "bg-trading-gold text-black shadow-lg shadow-trading-gold/20"
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
