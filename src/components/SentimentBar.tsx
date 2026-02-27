interface SentimentBarProps {
  bullish: number;
  bearish: number;
}

export default function SentimentBar({ bullish, bearish }: SentimentBarProps) {
  return (
    <div className="px-4 py-2.5 border-b border-trading-borderColor">
      <div className="flex items-center gap-3">
        <span className="text-trading-green font-bold text-sm min-w-[36px]">{bullish}%</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-l-full transition-all duration-500"
            style={{ width: `${bullish}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-r-full transition-all duration-500"
            style={{ width: `${bearish}%` }}
          />
        </div>
        <span className="text-trading-red font-bold text-sm min-w-[36px] text-right">{bearish}%</span>
      </div>
    </div>
  );
}
