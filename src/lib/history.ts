import type { AnalysisResult } from "../components/ResultPage";

export interface HistoryEntry {
  username: string;
  avatarUrl: string;
  totalScore: number;
  verdict: "Legitimate" | "Suspicious" | "Likely Bot";
  analyzedAt: string;
  result: AnalysisResult;
  input: string;
  jobDescription?: string;
}

const KEY = "devtrust_history";
const MAX = 10;

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: HistoryEntry): void {
  const existing = getHistory().filter((e) => e.username !== entry.username);
  existing.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(existing.slice(0, MAX)));
}
