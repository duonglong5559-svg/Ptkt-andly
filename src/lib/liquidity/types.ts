export interface LiquidityZone {
  low: number;
  high: number;
  intensity: number; // 0..1
  label?: string;
}

export interface LiquidityResult {
  zones: LiquidityZone[];
  source: "liquiheart" | "none";
  warning?: string;
}

