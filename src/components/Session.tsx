import { useEffect, useRef, useState } from "react";
import { Day, SessionItem } from "../lib/programme";
import { dayKey } from "../lib/storage";

interface Props {
  day: Day;
  completed: Record<string, boolean>;
  onToggleComplete: (key: string) => void;
  onBack: () => void;
}

export function Session({ day, completed, onToggleComplete, onBack }: Props) {
  const key = dayKey(day.week, day.dayIdx);
  const done = !!completed[key];
  const total = day.sessions.reduce((a, s) => a + s.durationMin, 0);

  return (
    <div data-route="session" className="page-rise pt-8 pb-16">
      <button onClick={onBack} className="btn btn-ghost mb-6 -ml-3">
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
          <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Schedule
      </button>

      <header className="mb-12">
        <div className="flex items-baseline justify-between gap-6 flex-wrap">
          <div>
            <div className="eyebrow mb-4">Week {day.week} · {day.label}</div>
            <h1 className="text-[clamp(2.25rem,6vw,3.75rem)] font-extrabold tracking-[-0.045em] leading-[0.98] max-w-[16ch]">
              {day.isTestDay ? "Self-test day" : day.sessions.length === 0 ? "Rest" : "Today's work"}
            </h1>
            {day.sessions.length > 0 && (
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <span className="tnum text-[var(--color-text-dim)] text-[15px]">{total} min total</span>
                <span className="text-[var(--color-text-mute)]">·</span>
                <span className="text-[var(--color-text-dim)] text-[15px]">{day.sessions.length} {day.sessions.length === 1 ? "block" : "blocks"}</span>
                {done && (
                  <>
                    <span className="text-[var(--color-text-mute)]">·</span>
                    <span className="eyebrow" style={{ color: "var(--color-rm-green-hi)" }}>Logged</span>
                  </>
                )}
              </div>
            )}
          </div>
          {day.sessions.length > 0 && (
            <button onClick={() => onToggleComplete(key)} className={done ? "btn btn-done" : "btn btn-secondary"}>
              {done ? (
                <>
                  <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                    <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Complete
                </>
              ) : "Mark complete"}
            </button>
          )}
        </div>
      </header>

      <div className="stagger space-y-4">
        {day.sessions.map((s, i) => (
          <Item key={i} item={s} />
        ))}
        {day.sessions.length === 0 && (
          <div className="surface p-8 text-center">
            <p className="text-[var(--color-text-dim)] max-w-[50ch] mx-auto">
              Recovery day. Walk. Mobilise. Eat well. Sleep eight or more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ item }: { item: SessionItem }) {
  return (
    <div className="tile p-6">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="text-[1.375rem] font-semibold tracking-tight">{item.title}</h2>
        <span className="eyebrow tnum shrink-0">{item.durationMin} min</span>
      </div>
      <div>
        {item.rep && <RepDetail item={item} />}
        {item.run && <RunDetail item={item} />}
        {item.swim && <SwimDetail item={item} />}
        {item.sandc && <SandcDetail item={item} />}
        {item.cond && <CondDetail item={item} />}
        {item.testKind && <TestDetail />}
      </div>
    </div>
  );
}

function RepDetail({ item }: { item: SessionItem }) {
  const sets = item.rep!.setReps ?? Array(item.rep!.sets).fill(item.rep!.reps);
  const total = sets.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        {sets.map((r, i) => (
          <SetTile key={i} idx={i + 1} reps={r} />
        ))}
      </div>
      <div className="mt-4 flex items-baseline justify-between text-[13px]">
        <div style={{ color: "var(--color-text-mute)" }}>
          Rest {item.rep!.rest}
          {item.rep!.notes && <span> · {item.rep!.notes}</span>}
        </div>
        <div className="tnum" style={{ color: "var(--color-text-dim)" }}>
          Total <span className="text-[var(--color-text)] font-medium">{total}</span>
        </div>
      </div>
    </div>
  );
}

function SetTile({ idx, reps }: { idx: number; reps: number }) {
  const [done, setDone] = useState(false);
  const [popping, setPopping] = useState(false);
  const toggle = () => {
    setDone(d => !d);
    setPopping(true);
    setTimeout(() => setPopping(false), 240);
  };
  return (
    <button
      onClick={toggle}
      className={[
        "tile tile-interactive",
        done ? "tile-done" : "",
        popping ? "set-pop" : "",
        "py-5 px-4 text-left",
      ].join(" ")}
    >
      <div className="eyebrow mb-3" style={{ fontSize: 10 }}>Set {idx}</div>
      <div className="stat-num tnum text-[2rem]">{reps}</div>
    </button>
  );
}

function RunDetail({ item }: { item: SessionItem }) {
  const r = item.run!;
  if (r.type === "liss") {
    return (
      <div>
        <div className="flex items-baseline gap-3">
          <span className="stat-num tnum text-[2.5rem]">{r.liss!.distanceMiles}</span>
          <span className="eyebrow">miles</span>
        </div>
        {r.liss!.targetPace && (
          <div className="mt-3 text-[13px]" style={{ color: "var(--color-text-mute)" }}>
            Pace · {r.liss!.targetPace}
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="stat-num tnum text-[2.5rem]">{r.hiit!.reps}</span>
        <span className="eyebrow">× 400 m</span>
      </div>
      <div className="mt-3 text-[13px]" style={{ color: "var(--color-text-dim)" }}>
        {r.hiit!.effort}
      </div>
      <div className="text-[13px]" style={{ color: "var(--color-text-mute)" }}>
        {r.hiit!.rest}
      </div>
      <IntervalTimer reps={r.hiit!.reps} restSec={60} workEstSec={75} />
    </div>
  );
}

function SwimDetail({ item }: { item: SessionItem }) {
  const s = item.swim!;
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="stat-num tnum text-[2.5rem]">{s.lengthsPerRep}</span>
        <span className="eyebrow">lengths × {s.reps}</span>
      </div>
      <div className="mt-3 text-[13px]" style={{ color: "var(--color-text-mute)" }}>
        {s.notes ?? `${s.restSec}s rest`}
      </div>
    </div>
  );
}

function SandcDetail({ item }: { item: SessionItem }) {
  const s = item.sandc!;
  return (
    <ul className="space-y-3">
      {s.exercises.map((ex, i) => (
        <li key={i} className="flex items-baseline justify-between gap-4 py-2.5 border-b border-[var(--color-hairline)] last:border-0">
          <span className="text-[15px]">{ex.name}</span>
          <span className="eyebrow tnum shrink-0">{ex.sets} × {ex.reps}</span>
        </li>
      ))}
    </ul>
  );
}

function CondDetail({ item }: { item: SessionItem }) {
  const c = item.cond!;
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="stat-num tnum text-[2.5rem]">{c.rounds}</span>
        <span className="eyebrow">rounds · {c.workSec}s on / {c.restSec}s off</span>
      </div>
      <ul className="space-y-1.5">
        {c.exercises.map((ex, i) => (
          <li key={i} className="text-[14px]" style={{ color: "var(--color-text-dim)" }}>
            {ex}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestDetail() {
  const items = [
    { label: "Warm-up", value: "10 min · light jog + dynamic mobility" },
    { label: "Press-ups", value: "1 set to failure" },
    { label: "Sit-ups", value: "2 min max" },
    { label: "Pull-ups", value: "1 set to failure (beam)" },
    { label: "1.5 mile", value: "For time" },
    { label: "Bleep test", value: "Optional · launch from header" },
  ];
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex items-baseline justify-between gap-4 py-2.5 border-b border-[var(--color-hairline)] last:border-0">
          <span className="eyebrow">{it.label}</span>
          <span className="text-[14px]" style={{ color: "var(--color-text-dim)" }}>{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

function IntervalTimer({ reps, restSec, workEstSec }: { reps: number; restSec: number; workEstSec: number }) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "work" | "rest" | "done">("idle");
  const [repIdx, setRepIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    tickRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r > 1) return r - 1;
        setPhase(p => {
          if (p === "work") {
            setRemaining(restSec);
            return "rest";
          }
          if (p === "rest") {
            setRepIdx(i => {
              const next = i + 1;
              if (next >= reps) {
                setRunning(false);
                setRemaining(0);
                return i;
              }
              setRemaining(workEstSec);
              return next;
            });
            return "work";
          }
          return p;
        });
        return 0;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running, reps, restSec, workEstSec]);

  const start = () => {
    setRepIdx(0);
    setPhase("work");
    setRemaining(workEstSec);
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    setPhase("idle");
    setRepIdx(0);
    setRemaining(0);
  };

  const phaseCls = phase === "work" ? "phase-work" : phase === "rest" ? "phase-rest" : "";
  return (
    <div className={`surface mt-5 p-5 flex items-center gap-5 ${phaseCls}`}>
      <div className="flex-1">
        <div className="eyebrow mb-2">
          {phase === "idle" ? "Interval timer" : phase === "work" ? `Work · rep ${repIdx + 1}/${reps}` : `Rest · ${repIdx + 1}/${reps}`}
        </div>
        <div className="stat-num tnum text-[2.5rem] transition-colors duration-[160ms]">
          {remaining}<span className="text-[var(--color-text-mute)] text-[1rem] font-normal ml-1">s</span>
        </div>
      </div>
      {!running ? (
        <button onClick={start} className="btn btn-primary">Start</button>
      ) : (
        <button onClick={stop} className="btn btn-danger">Stop</button>
      )}
    </div>
  );
}
