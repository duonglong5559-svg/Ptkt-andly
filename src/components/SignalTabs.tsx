interface SignalTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  trendLineCount: number;
}

const tabs = [
  { id: "live", label: "Tín hiệu Live" },
  { id: "analysis", label: "Phân tích thị trường" },
  { id: "trendlines", label: "Đường xu hướng" },
  { id: "patterns", label: "Mô hình nến" },
];

export default function SignalTabs({ activeTab, onTabChange, trendLineCount }: SignalTabsProps) {
  return (
    <div className="border-b border-trading-borderColor">
      <div className="flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2.5 text-[10px] font-semibold whitespace-nowrap transition-all relative ${
              activeTab === tab.id
                ? "text-white"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            {tab.label}
            {tab.id === "trendlines" && (
              <span className="ml-0.5 text-trading-gold">({trendLineCount})</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-trading-gold rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
