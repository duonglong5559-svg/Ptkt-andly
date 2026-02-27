import { useEffect, useState } from "react";

interface SentimentBarProps {
  bullish: number;
  bearish: number;
}

export default function SentimentBar({ bullish, bearish }: SentimentBarProps) {
  const [animBull, setAnimBull] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimBull(bullish), 100);
    return () => clearTimeout(timer);
  }, [bullish]);

  return (
    <div className="px-3 py-2 border-b border-trading-borderColor">
      <div className="flex items-center gap-2">
        <span className="text-trading-green font-bold text-xs min-w-[32px]">{bullish}%</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden flex bg-gray-800/80">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-l-full transition-all duration-1000 ease-out"
            style={{ width: `${animBull}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-r-full transition-all duration-1000 ease-out"
            style={{ width: `${100 - animBull}%` }}
          />
        </div>
        <span className="text-trading-red font-bold text-xs min-w-[32px] text-right">{bearish}%</span>
      </div>
    </div>
  );
}
