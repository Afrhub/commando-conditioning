import { useEffect, useState } from "react";
import { AppState, load, save, reset } from "./lib/storage";
import { Intake } from "./components/Intake";
import { Schedule } from "./components/Schedule";
import { Session } from "./components/Session";
import { BleepTest } from "./components/BleepTest";
import { Header } from "./components/Header";
import { Cinema } from "./components/Cinema";

type View =
  | { kind: "intake" }
  | { kind: "schedule" }
  | { kind: "session"; week: number; dayIdx: number }
  | { kind: "bleep" };

export function App() {
  const [state, setState] = useState<AppState>(() => load());
  const [view, setView] = useState<View>(() => (load().programme ? { kind: "schedule" } : { kind: "intake" }));

  useEffect(() => save(state), [state]);

  const onReset = () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    reset();
    setState(load());
    setView({ kind: "intake" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Cinema />
      <Header
        view={view}
        onHome={() => setView(state.programme ? { kind: "schedule" } : { kind: "intake" })}
        onBleep={() => setView({ kind: "bleep" })}
        onReset={onReset}
        hasProgramme={!!state.programme}
      />
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 sm:px-7">
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
              setView({ kind: "schedule" });
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
            onBack={() => setView(state.programme ? { kind: "schedule" } : { kind: "intake" })}
          />
        )}
      </main>
    </div>
  );
}
