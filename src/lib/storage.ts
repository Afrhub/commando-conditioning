import { IntakeScores } from "./standards";
import { Programme } from "./programme";

const KEY = "commando-conditioning:v1";

export interface AppState {
  intake: IntakeScores | null;
  programme: Programme | null;
  startDate: string | null; // ISO yyyy-mm-dd
  completedDays: Record<string, boolean>; // key = `w${week}-d${dayIdx}`
  bleepResults: { date: string; level: number }[];
}

export const empty: AppState = {
  intake: null,
  programme: null,
  startDate: null,
  completedDays: {},
  bleepResults: [],
};

export function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function save(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function reset(): void {
  localStorage.removeItem(KEY);
}

export function dayKey(week: number, dayIdx: number): string {
  return `w${week}-d${dayIdx}`;
}
