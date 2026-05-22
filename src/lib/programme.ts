import { IntakeScores, lengthsInMile, recommendProgrammeWeeks } from "./standards";

export type Discipline =
  | "press"
  | "sit"
  | "pull"
  | "run-liss"
  | "run-hiit"
  | "swim"
  | "sandc"
  | "conditioning"
  | "rest"
  | "test";

export interface RepBlock {
  sets: number;
  reps: number; // for unit work
  setReps?: number[]; // when sets differ
  rest?: string;
  notes?: string;
}

export interface RunBlock {
  type: "liss" | "hiit";
  liss?: { distanceMiles: number; targetPace?: string };
  hiit?: { reps: number; effort: string; rest: string };
}

export interface SwimBlock {
  lengthsPerRep: number;
  reps: number;
  restSec: number;
  notes?: string;
}

export interface SandCBlock {
  focus: "posterior" | "core";
  exercises: { name: string; sets: number; reps: string }[];
}

export interface ConditioningBlock {
  rounds: number;
  workSec: number;
  restSec: number;
  exercises: string[];
}

export interface SessionItem {
  discipline: Discipline;
  title: string;
  rep?: RepBlock;
  run?: RunBlock;
  swim?: SwimBlock;
  sandc?: SandCBlock;
  cond?: ConditioningBlock;
  testKind?: "rmft" | "self-test";
  durationMin: number;
}

export interface Day {
  week: number; // 1-indexed
  dayIdx: number; // 0-6 (Mon-Sun)
  label: string; // e.g. "Mon"
  sessions: SessionItem[]; // empty = rest
  isTestDay?: boolean;
}

export interface Programme {
  weeks: 8 | 10 | 12;
  startScores: IntakeScores;
  days: Day[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ===== Regain method =====
// Press/sit: +1 rep to one set per day, 6 days/wk (Sun rest from regain).
// Pull: +1 rep to one set per week.
// Three sets each. Day 1 sets = [base, base, base]. Each day, one set increments.
// We rotate which set increments to spread load.
function regainSets(base: number, dayNumber: number): number[] {
  if (base <= 0) base = Math.max(1, base);
  const setIdx = (dayNumber - 1) % 3;
  const cycles = Math.floor((dayNumber - 1) / 3);
  const sets = [base, base, base];
  for (let i = 0; i < 3; i++) {
    sets[i] += cycles + (i <= setIdx ? 1 : 0);
  }
  // dayNumber=1 → cycles=0, setIdx=0 → [base+1, base, base]
  // dayNumber=2 → cycles=0, setIdx=1 → [base+1, base+1, base]
  // dayNumber=3 → cycles=0, setIdx=2 → [base+1, base+1, base+1]
  // dayNumber=4 → cycles=1, setIdx=0 → [base+2, base+1, base+1]
  return sets;
}

function regainPullSets(base: number, weekNumber: number): number[] {
  if (base <= 0) base = 1;
  const setIdx = (weekNumber - 1) % 3;
  const cycles = Math.floor((weekNumber - 1) / 3);
  const sets = [base, base, base];
  for (let i = 0; i < 3; i++) {
    sets[i] += cycles + (i <= setIdx ? 1 : 0);
  }
  return sets;
}

// Count regain training days up to (and including) a given week/dayIdx, excluding rest day.
function regainDayNumber(week: number, dayIdx: number, restDayIdx: number): number | null {
  if (dayIdx === restDayIdx) return null;
  const daysInPriorWeeks = (week - 1) * 6;
  let dayInWeek = 0;
  for (let d = 0; d < dayIdx; d++) if (d !== restDayIdx) dayInWeek++;
  return daysInPriorWeeks + dayInWeek + 1;
}

// ===== Run progression =====
// LISS: build from start mileage to 7 mi over programme length.
// HIIT: reps around 400m track, 1 min rest. Start at 6 reps, build to 14.
function lissMiles(start: number, week: number, totalWeeks: number): number {
  const end = 7;
  const ratio = (week - 1) / Math.max(1, totalWeeks - 1);
  const m = start + (end - start) * ratio;
  return Math.round(m * 2) / 2; // round to nearest 0.5 mi
}

function hiitReps(week: number, totalWeeks: number): number {
  const start = 6;
  const end = 14;
  const ratio = (week - 1) / Math.max(1, totalWeeks - 1);
  return Math.round(start + (end - start) * ratio);
}

// ===== Swim progression =====
// Start at currentLengths × 10 reps with 1 min rest.
// Each session +1 length until lengths/rep reaches lengthsInMile(poolLengthM).
function swimSessionPlan(
  sessionIdx: number, // 0-based across whole programme
  startLengths: number,
  poolLengthM: number,
): SwimBlock {
  const targetLengths = lengthsInMile(poolLengthM);
  let lengthsPerRep = Math.max(1, startLengths) + sessionIdx;
  if (lengthsPerRep > targetLengths) lengthsPerRep = targetLengths;
  const baseReps = 10;
  // As reps get longer, drop set count gradually to keep time sane.
  let reps = baseReps;
  if (lengthsPerRep >= targetLengths) reps = 1;
  else if (lengthsPerRep > targetLengths / 2) reps = Math.max(3, Math.round(baseReps * (targetLengths / lengthsPerRep) * 0.5));
  else if (lengthsPerRep > targetLengths / 4) reps = 6;
  return {
    lengthsPerRep,
    reps,
    restSec: 60,
    notes: lengthsPerRep >= targetLengths
      ? `1 mile continuous (${targetLengths} lengths)`
      : `${lengthsPerRep} lengths × ${reps}, 1 min rest`,
  };
}

// ===== Day plans =====
// Pattern (Mon-Sun):
//   Mon: regain (P/S/Pu) + run-liss
//   Tue: swim + regain
//   Wed: S&C posterior + run-hiit
//   Thu: regain + conditioning
//   Fri: swim + regain
//   Sat: long run-liss + S&C core
//   Sun: rest
// Every 3rd week Saturday → self-test (RMFT-style).
const REST_DAY = 6; // Sunday

function regainItem(sets: number[], discipline: Discipline, title: string): SessionItem {
  return {
    discipline,
    title,
    rep: {
      sets: sets.length,
      reps: sets[0],
      setReps: sets,
      rest: "90 sec",
    },
    durationMin: 8,
  };
}

function pullItem(sets: number[]): SessionItem {
  return {
    discipline: "pull",
    title: "Pull-ups (beam)",
    rep: {
      sets: sets.length,
      reps: sets[0],
      setReps: sets,
      rest: "2 min",
      notes: "Beam grip (palm-down) if available — harder than bar.",
    },
    durationMin: 10,
  };
}

function runLissItem(start: number, week: number, totalWeeks: number, isLong: boolean): SessionItem {
  const miles = isLong ? Math.min(7, lissMiles(start, week, totalWeeks) + 1) : lissMiles(start, week, totalWeeks);
  return {
    discipline: "run-liss",
    title: isLong ? `Long run — ${miles} mi` : `LISS run — ${miles} mi`,
    run: {
      type: "liss",
      liss: { distanceMiles: miles, targetPace: "conversational, nose-breathing" },
    },
    durationMin: Math.round(miles * 9),
  };
}

function runHiitItem(week: number, totalWeeks: number): SessionItem {
  const reps = hiitReps(week, totalWeeks);
  return {
    discipline: "run-hiit",
    title: `HIIT — ${reps} × 400 m`,
    run: {
      type: "hiit",
      hiit: { reps, effort: "90-95% effort, 400 m (1 lap track or pitch length-width-length-width)", rest: "1 min between reps" },
    },
    durationMin: reps * 3 + 10,
  };
}

function sandcPosterior(): SessionItem {
  return {
    discipline: "sandc",
    title: "S&C — posterior chain",
    sandc: {
      focus: "posterior",
      exercises: [
        { name: "Romanian deadlift", sets: 4, reps: "6-8" },
        { name: "Single-leg hip thrust", sets: 3, reps: "10/side" },
        { name: "Walking lunge (loaded)", sets: 3, reps: "12/side" },
        { name: "Calf raise (single leg)", sets: 3, reps: "15/side" },
      ],
    },
    durationMin: 35,
  };
}

function sandcCore(): SessionItem {
  return {
    discipline: "sandc",
    title: "S&C — core",
    sandc: {
      focus: "core",
      exercises: [
        { name: "Plank (front)", sets: 3, reps: "60 sec" },
        { name: "Side plank", sets: 3, reps: "45 sec/side" },
        { name: "Hollow body hold", sets: 3, reps: "30 sec" },
        { name: "Dead bug", sets: 3, reps: "10/side" },
        { name: "Ab wheel rollout (or slow plank reach)", sets: 3, reps: "8-10" },
      ],
    },
    durationMin: 30,
  };
}

function conditioningItem(week: number, totalWeeks: number): SessionItem {
  const rounds = Math.min(6, 3 + Math.floor(((week - 1) / totalWeeks) * 4));
  return {
    discipline: "conditioning",
    title: `Conditioning circuit — ${rounds} rounds`,
    cond: {
      rounds,
      workSec: 40,
      restSec: 20,
      exercises: ["Jump squats", "Lunge jumps", "Burpees", "Mountain climbers", "Sprint 20m × back"],
    },
    durationMin: rounds * 5 + 5,
  };
}

function testItem(): SessionItem {
  return {
    discipline: "test",
    title: "Self-test — RMFT (bleep + press/sit/pull/1.5mi)",
    testKind: "rmft",
    durationMin: 75,
  };
}

export function generateProgramme(scores: IntakeScores): Programme {
  const weeks = recommendProgrammeWeeks(scores);
  const days: Day[] = [];

  // Run start mileage = current 1.5mi (i.e. start LISS at 1.5 then grow)
  const lissStart = 1.5;

  // Swim sessions count across programme (2 per week → up to weeks*2)
  let swimIdx = 0;

  for (let w = 1; w <= weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const label = DAY_LABELS[d];
      const day: Day = { week: w, dayIdx: d, label, sessions: [] };

      if (d === REST_DAY) {
        days.push(day);
        continue;
      }

      const isTestSat = d === 5 && w % 3 === 0 && w < weeks;
      const isLastSat = d === 5 && w === weeks;

      if (isTestSat || isLastSat) {
        day.isTestDay = true;
        day.sessions.push(testItem());
        days.push(day);
        continue;
      }

      const dayNum = regainDayNumber(w, d, REST_DAY)!;
      const pSets = regainSets(scores.pressUps, dayNum);
      const sSets = regainSets(scores.sitUps, dayNum);
      const puSets = regainPullSets(scores.pullUps, w);

      switch (d) {
        case 0: // Mon: regain + LISS
          day.sessions.push(
            regainItem(pSets, "press", "Press-ups"),
            regainItem(sSets, "sit", "Sit-ups"),
            pullItem(puSets),
            runLissItem(lissStart, w, weeks, false),
          );
          break;
        case 1: // Tue: swim + regain (no pull on swim day to spare lats)
          day.sessions.push(
            { ...swimItemFrom(swimSessionPlan(swimIdx++, scores.swimLengths, scores.poolLengthM)) },
            regainItem(pSets, "press", "Press-ups"),
            regainItem(sSets, "sit", "Sit-ups"),
          );
          break;
        case 2: // Wed: S&C posterior + HIIT
          day.sessions.push(sandcPosterior(), runHiitItem(w, weeks));
          break;
        case 3: // Thu: regain + conditioning
          day.sessions.push(
            regainItem(pSets, "press", "Press-ups"),
            regainItem(sSets, "sit", "Sit-ups"),
            pullItem(puSets),
            conditioningItem(w, weeks),
          );
          break;
        case 4: // Fri: swim + regain
          day.sessions.push(
            { ...swimItemFrom(swimSessionPlan(swimIdx++, scores.swimLengths, scores.poolLengthM)) },
            regainItem(pSets, "press", "Press-ups"),
            regainItem(sSets, "sit", "Sit-ups"),
          );
          break;
        case 5: // Sat: long LISS + S&C core
          day.sessions.push(runLissItem(lissStart, w, weeks, true), sandcCore());
          break;
      }
      days.push(day);
    }
  }

  return { weeks, startScores: scores, days };
}

function swimItemFrom(plan: SwimBlock): SessionItem {
  return {
    discipline: "swim",
    title: plan.notes ?? "Swim",
    swim: plan,
    durationMin: Math.max(20, plan.reps * (plan.lengthsPerRep * 1 + 1) + 5),
  };
}
