import type { ResistanceLevel } from "@/data/tradingData";

export interface TrainingExample {
  createdAt: string;
  symbol: string;
  timeframe: string;
  source?: string;
  level: ResistanceLevel;
}

const STORAGE_KEY = "ptkt_training_dataset_v1";

export function loadTrainingExamples(): TrainingExample[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TrainingExample[];
  } catch {
    return [];
  }
}

export function appendTrainingExample(ex: TrainingExample) {
  const all = loadTrainingExamples();
  all.unshift(ex);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 500)));
}

export function clearTrainingExamples() {
  localStorage.removeItem(STORAGE_KEY);
}

export function toJsonl(examples: TrainingExample[]) {
  return examples.map((e) => JSON.stringify(e)).join("\n") + (examples.length ? "\n" : "");
}

export function downloadJsonlFile(filename: string, jsonl: string) {
  const blob = new Blob([jsonl], { type: "application/jsonl;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

