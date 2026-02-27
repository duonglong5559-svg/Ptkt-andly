import { AIAnalysisScore } from "@/lib/technicalAnalysis";
import { Brain, TrendingUp, Gauge, BarChart3, Shapes, Shield, Activity } from "lucide-react";

interface AIAnalysisPanelProps {
  score: AIAnalysisScore;
}

const FACTORS = [
  { key: "trendScore", label: "Xu hướng", icon: TrendingUp },
  { key: "momentumScore", label: "Động lượng", icon: Gauge },
  { key: "volumeScore", label: "Khối lượng", icon: BarChart3 },
  { key: "patternScore", label: "Mô hình nến", icon: Shapes },
  { key: "srScore", label: "Hỗ trợ/Kháng cự", icon: Shield },
  { key: "volatilityScore", label: "Biến động", icon: Activity },
] as const;

function ScoreBar({ value, label, icon: Icon }: { value: number; label: string; icon: any }) {
  const color =
    value >= 65 ? "from-green-600 to-green-400" :
    value >= 45 ? "from-yellow-600 to-yellow-400" :
    "from-red-600 to-red-400";
  const textColor = value >= 65 ? "text-green-400" : value >= 45 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex items-center gap-2 animate-fadeInUp">
      <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-0.5">
          <span className="text-[9px] text-muted-foreground">{label}</span>
          <span className={`text-[9px] font-bold ${textColor}`}>{value}</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AIAnalysisPanel({ score }: AIAnalysisPanelProps) {
  const overallColor =
    score.overall >= 65 ? "text-green-400 border-green-500/30 bg-green-500/5" :
    score.overall >= 45 ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/5" :
    "text-red-400 border-red-500/30 bg-red-500/5";

  const ringColor =
    score.overall >= 65 ? "stroke-green-400" :
    score.overall >= 45 ? "stroke-yellow-400" :
    "stroke-red-400";

  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score.overall / 100) * circumference;

  return (
    <div className="px-3 py-3 space-y-3 animate-fadeIn">
      {/* AI Overall Score */}
      <div className={`rounded-xl border p-3 ${overallColor}`}>
        <div className="flex items-center gap-3">
          {/* Circular score */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg width="80" height="80" className="-rotate-90">
              <circle cx="40" cy="40" r="38" fill="none" stroke="#1f2937" strokeWidth="4" />
              <circle
                cx="40" cy="40" r="38" fill="none"
                className={ringColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Brain className="w-3 h-3 mb-0.5 text-purple-400" />
              <span className="text-lg font-black">{score.overall}</span>
              <span className="text-[7px] text-muted-foreground">/ 100</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-[10px] font-bold mb-1 flex items-center gap-1">
              <Brain className="w-3 h-3 text-purple-400" />
              AI Phân tích
            </div>
            <p className="text-xs font-semibold mb-1">{score.verdict}</p>
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              Đánh giá dựa trên 6 yếu tố kỹ thuật với trọng số AI
            </p>
          </div>
        </div>
      </div>

      {/* Factor scores */}
      <div className="bg-secondary/20 rounded-lg p-3 space-y-2">
        <h4 className="text-[10px] font-bold text-purple-300 flex items-center gap-1 mb-2">
          <Gauge className="w-3 h-3" /> Điểm chi tiết các yếu tố
        </h4>
        {FACTORS.map((f, i) => (
          <div key={f.key} style={{ animationDelay: `${i * 80}ms` }}>
            <ScoreBar
              value={score[f.key]}
              label={f.label}
              icon={f.icon}
            />
          </div>
        ))}
      </div>

      {/* AI Reasoning */}
      {score.details.length > 0 && (
        <div className="bg-secondary/20 rounded-lg p-3">
          <h4 className="text-[10px] font-bold text-purple-300 flex items-center gap-1 mb-2">
            <Brain className="w-3 h-3" /> Phân tích chi tiết AI
          </h4>
          <div className="space-y-1">
            {score.details.map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 text-[9px] text-muted-foreground animate-fadeInUp"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-purple-400 mt-px">▸</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
