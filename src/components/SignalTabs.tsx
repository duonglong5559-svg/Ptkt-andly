interface SignalTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  trendLineCount: number;
  highProbabilityCount: number;
}

const tabs = [
  { id: "live", label: "Tín hiệu Live" },
  { id: "analysis", label: "Phân tích thị trường" },
  { id: "llm", label: "LLM Setup" },
  { id: "trendlines", label: "Đường xu hướng" },
  { id: "liquidity", label: "Liquidity Map" },
  { id: "futures", label: "Futures / Forex" },
];

export default function SignalTabs({
  activeTab,
  onTabChange,
  trendLineCount,
  highProbabilityCount,
}: SignalTabsProps) {
  return (
    <div className="border-b border-trading-borderColor">
      <div className="flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-all relative ${
              activeTab === tab.id
                ? "text-white bg-secondary/50"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            {tab.label}
            {tab.id === "trendlines" && (
              <span className="ml-1 text-trading-gold">( {trendLineCount} )</span>
            )}
            {tab.id === "analysis" && (
              <span className="ml-1 text-emerald-400">( {highProbabilityCount} )</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-trading-gold" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
