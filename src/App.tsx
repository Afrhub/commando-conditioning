import { useEffect, useState } from "react";
import { AppState, load, save, reset } from "./lib/storage";
import { Intake } from "./components/Intake";
import { Schedule } from "./components/Schedule";
import { Session } from "./components/Session";
import { BleepTest } from "./components/BleepTest";
import { Header } from "./components/Header";
import { Cinema } from "./components/Cinema";
import { Spine, SpineSection } from "./components/Spine";
import { BootLoader, shouldShowBoot } from "./components/BootLoader";
import { STANDARDS } from "./lib/standards";

type View =
  | { kind: "spine" }
  | { kind: "intake" }
  | { kind: "schedule" }
  | { kind: "session"; week: number; dayIdx: number }
  | { kind: "bleep" };

export function App() {
  const [state, setState] = useState<AppState>(() => load());
  const [view, setView] = useState<View>(() => ({ kind: "spine" }));
  const [booting, setBooting] = useState(() => shouldShowBoot());

  useEffect(() => save(state), [state]);

  const onReset = () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    reset();
    setState(load());
    setView({ kind: "intake" });
  };

  const goHome = () => setView({ kind: "spine" });

  if (booting) {
    return (
      <>
        <Cinema />
        <BootLoader onDone={() => setBooting(false)} />
      </>
    );
  }

  // Spine landing — always the entry point.
  if (view.kind === "spine") {
    const programme = state.programme;
    const totalDays = programme?.days.filter(d => d.sessions.length > 0).length ?? 0;
    const doneDays = programme?.days.filter(d =>
      state.completedDays[`w${d.week}-d${d.dayIdx}`]
    ).length ?? 0;
    const pct = totalDays === 0 ? 0 : Math.round((doneDays / totalDays) * 100);
    const nextDay = findNextDay(state);
    const lastBleep = state.bleepResults[state.bleepResults.length - 1]?.level;

    const sections: SpineSection[] = programme ? [
      {
        id: "today",
        eyebrow: "TODAY · UNIT 01",
        title: nextDay
          ? `Wk ${String(nextDay.week).padStart(2, "0")} · ${nextDay.label}`
          : "Programme complete",
        detail: nextDay
          ? `${nextDay.sessions.length} block${nextDay.sessions.length === 1 ? "" : "s"} · ${nextDay.sessions.reduce((a, s) => a + s.durationMin, 0)} min total`
          : "All sessions logged. Re-run baseline.",
        cta: "Open session",
        accent: "gold",
        onActivate: () => {
          if (nextDay) setView({ kind: "session", week: nextDay.week, dayIdx: nextDay.dayIdx });
          else setView({ kind: "schedule" });
        },
      },
      {
        id: "schedule",
        eyebrow: "PROGRAMME · UNIT 02",
        title: `${programme.weeks}-week plan`,
        detail: `${doneDays} / ${totalDays} sessions logged · ${pct}% complete`,
        cta: "View schedule",
        accent: "green",
        onActivate: () => setView({ kind: "schedule" }),
      },
      {
        id: "bleep",
        eyebrow: "BLEEP · UNIT 03",
        title: "Multi-stage fitness test",
        detail: lastBleep
          ? `Last result: ${lastBleep} · target ≥ 12.0`
          : "MSFT 20m shuttle · pass 11.5 · target 12.0+",
        cta: "Run test",
        accent: "red",
        onActivate: () => setView({ kind: "bleep" }),
      },
      {
        id: "baseline",
        eyebrow: "INTAKE · UNIT 04",
        title: "Edit baseline",
        detail: state.intake
          ? `Press ${state.intake.pressUps} · Sit ${state.intake.sitUps} · Pull ${state.intake.pullUps}`
          : "Set your current scores",
        cta: "Open form",
        accent: "white",
        onActivate: () => setView({ kind: "intake" }),
      },
      {
        id: "standards",
        eyebrow: "STANDARDS · UNIT 05",
        title: "Entrance pass marks",
        detail: `Press ${STANDARDS.pressUps.pass} · Sit ${STANDARDS.sitUps.pass} · Pull ${STANDARDS.pullUps.pass} · 1.5mi ≤ 10:30 · Bleep ${STANDARDS.bleep.pass}`,
        cta: "Open schedule",
        accent: "blue",
        onActivate: () => setView({ kind: "schedule" }),
      },
      {
        id: "brief",
        eyebrow: "DOSSIER · UNIT 06",
        title: "Per Mare Per Terram",
        detail: "Royal Marines entrance training programme. Regain method for bodyweight, LISS + HIIT for running, swim ladder to 1 mile continuous.",
        cta: "Open schedule",
        accent: "gold",
        onActivate: () => setView({ kind: "schedule" }),
      },
    ] : [
      // Pre-intake spine — new visitor first-paint
      {
        id: "begin",
        eyebrow: "PHASE 0 · UNIT 01",
        title: "Set baseline",
        detail: "Enter your current press-ups, sit-ups, pull-ups, 1.5 mile time and swim lengths. The programme generates from there.",
        cta: "Begin intake",
        accent: "gold",
        onActivate: () => setView({ kind: "intake" }),
      },
      {
        id: "standards",
        eyebrow: "STANDARDS · UNIT 02",
        title: "Entrance pass marks",
        detail: `Press ${STANDARDS.pressUps.pass} · Sit ${STANDARDS.sitUps.pass} · Pull ${STANDARDS.pullUps.pass} · 1.5mi ≤ 10:30 · Bleep ${STANDARDS.bleep.pass}`,
        cta: "Begin intake",
        accent: "blue",
        onActivate: () => setView({ kind: "intake" }),
      },
      {
        id: "bleep",
        eyebrow: "BLEEP · UNIT 03",
        title: "Multi-stage fitness test",
        detail: "20m shuttle. Pass 11.5. Commando target 12.0+. Try it now without intake.",
        cta: "Run test",
        accent: "red",
        onActivate: () => setView({ kind: "bleep" }),
      },
      {
        id: "regain",
        eyebrow: "METHOD · UNIT 04",
        title: "The regain method",
        detail: "3 sets daily, 6 days a week. Press + sit +1 rep per day to one set. Pull +1 per week. Sean Lerwill's original.",
        cta: "Begin intake",
        accent: "green",
        onActivate: () => setView({ kind: "intake" }),
      },
      {
        id: "swim",
        eyebrow: "WATER · UNIT 05",
        title: "Swim ladder to 1 mile",
        detail: "From wherever you start to a mile continuous. Lengths × reps with 1 min rest. Adds one length per session.",
        cta: "Begin intake",
        accent: "blue",
        onActivate: () => setView({ kind: "intake" }),
      },
      {
        id: "brief",
        eyebrow: "DOSSIER · UNIT 06",
        title: "Per Mare Per Terram",
        detail: "12-week programme to take a civilian from current state to Royal Marines entrance pass scores. Regain method + LISS + HIIT + swim + S&C + conditioning.",
        cta: "Begin intake",
        accent: "gold",
        onActivate: () => setView({ kind: "intake" }),
      },
    ];

    return (
      <div className="min-h-screen flex flex-col">
        <Cinema />
        <Header
          view={view}
          onHome={goHome}
          onBleep={() => setView({ kind: "bleep" })}
          onReset={onReset}
          hasProgramme={!!state.programme}
        />
        <Spine sections={sections} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Cinema />
      <Header
        view={view}
        onHome={goHome}
        onBleep={() => setView({ kind: "bleep" })}
        onReset={onReset}
        hasProgramme={!!state.programme}
      />
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 sm:px-7" style={{ paddingTop: 24 }}>
        {view.kind === "intake" && (
          <Intake
            initial={state.intake}
            onSubmit={(intake, programme) => {
              setState(s => ({
                ...s,
                intake,
                programme,
                startDate: new Date().toISOString().slice(0, 10),
              }));
              setView({ kind: "spine" });
            }}
          />
        )}
        {view.kind === "schedule" && state.programme && (
          <Schedule
            programme={state.programme}
            completed={state.completedDays}
            onOpenDay={(week, dayIdx) => setView({ kind: "session", week, dayIdx })}
            onEditIntake={() => setView({ kind: "intake" })}
          />
        )}
        {view.kind === "session" && state.programme && (
          <Session
            day={state.programme.days.find(d => d.week === view.week && d.dayIdx === view.dayIdx)!}
            completed={state.completedDays}
            onToggleComplete={key =>
              setState(s => ({
                ...s,
                completedDays: { ...s.completedDays, [key]: !s.completedDays[key] },
              }))
            }
            onBack={() => setView({ kind: "schedule" })}
          />
        )}
        {view.kind === "bleep" && (
          <BleepTest
            onResult={level =>
              setState(s => ({
                ...s,
                bleepResults: [...s.bleepResults, { date: new Date().toISOString().slice(0, 10), level }],
              }))
            }
            results={state.bleepResults}
            onBack={() => setView(state.programme ? { kind: "spine" } : { kind: "intake" })}
          />
        )}
      </main>
    </div>
  );
}

function findNextDay(state: AppState): { week: number; dayIdx: number; label: string; sessions: { durationMin: number }[] } | null {
  if (!state.programme) return null;
  for (const d of state.programme.days) {
    if (d.sessions.length === 0) continue;
    const k = `w${d.week}-d${d.dayIdx}`;
    if (!state.completedDays[k]) return d as unknown as { week: number; dayIdx: number; label: string; sessions: { durationMin: number }[] };
  }
  return null;
}
