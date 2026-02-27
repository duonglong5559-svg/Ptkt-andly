export function ema(values: number[], period: number): number[] {
  if (period <= 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev: number | undefined;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) {
      out.push(Number.NaN);
      continue;
    }
    if (prev === undefined) {
      prev = v;
    } else {
      prev = v * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

