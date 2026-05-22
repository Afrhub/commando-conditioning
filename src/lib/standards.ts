// Royal Marines entrance standards + scoring helpers.
// Pass marks = minimum to pass entrance test.
// Target marks = commando-pass-rate benchmark (higher correlates with passing CTC).

export type Sex = "male" | "female";

export interface IntakeScores {
  age: number;
  weightKg: number;
  heightCm: number;
  pressUps: number;
  sitUps: number;
  pullUps: number;
  runMileAndHalfSec: number;
  poolLengthM: number;
  swimLengths: number;
}

export interface Standard {
  label: string;
  pass: number;
  target: number;
  unit: string;
  betterIsHigher: boolean;
}

export const STANDARDS: Record<string, Standard> = {
  pressUps: { label: "Press-ups", pass: 40, target: 60, unit: "reps", betterIsHigher: true },
  sitUps: { label: "Sit-ups", pass: 50, target: 85, unit: "reps", betterIsHigher: true },
  pullUps: { label: "Pull-ups (beam)", pass: 5, target: 16, unit: "reps", betterIsHigher: true },
  runMileAndHalfSec: { label: "1.5 mile run", pass: 630, target: 600, unit: "sec", betterIsHigher: false },
  bleep: { label: "Bleep test level", pass: 11.5, target: 12.0, unit: "level", betterIsHigher: true },
  swimMileLengths: { label: "Continuous swim", pass: 0, target: 0, unit: "mile", betterIsHigher: true },
};

export interface GapResult {
  key: string;
  current: number;
  target: number;
  pass: number;
  gapToPass: number;
  gapToTarget: number;
  weakness: 0 | 1 | 2 | 3; // 0 = above target, 3 = far from pass
}

export function gap(key: keyof typeof STANDARDS, current: number): GapResult {
  const s = STANDARDS[key];
  const gapToPass = s.betterIsHigher ? s.pass - current : current - s.pass;
  const gapToTarget = s.betterIsHigher ? s.target - current : current - s.target;
  let weakness: 0 | 1 | 2 | 3 = 0;
  if (gapToTarget > 0) weakness = 1;
  if (gapToPass > 0) weakness = 2;
  if (gapToPass > s.pass * 0.4) weakness = 3;
  return { key, current, target: s.target, pass: s.pass, gapToPass, gapToTarget, weakness };
}

// Lengths in 1 mile, depending on pool length. 1 mile = 1609 m.
export function lengthsInMile(poolLengthM: number): number {
  return Math.ceil(1609 / poolLengthM);
}

// Programme length recommendation based on weakness profile.
// If all elements are already past pass marks, 8 weeks suffices.
// If most are past pass but not target, 10 weeks.
// Otherwise 12 weeks (default).
export function recommendProgrammeWeeks(scores: IntakeScores): 8 | 10 | 12 {
  const gaps = [
    gap("pressUps", scores.pressUps),
    gap("sitUps", scores.sitUps),
    gap("pullUps", scores.pullUps),
    gap("runMileAndHalfSec", scores.runMileAndHalfSec),
  ];
  const maxWeakness = Math.max(...gaps.map(g => g.weakness));
  if (maxWeakness === 0) return 8;
  if (maxWeakness === 1) return 10;
  return 12;
}

export function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseTimeToSec(input: string): number {
  const parts = input.split(":").map(p => parseInt(p, 10));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}
