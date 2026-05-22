import { useEffect, useRef, useState } from "react";

interface Props {
  onResult: (level: number) => void;
  results: { date: string; level: number }[];
  onBack: () => void;
}

const SHUTTLES_PER_LEVEL = [7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16];
const SPEED_KMH = [8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 12.0, 12.5, 13.0, 13.5, 14.0, 14.5, 15.0, 15.5, 16.0, 16.5, 17.0, 17.5, 18.0, 18.5];
const SHUTTLE_DISTANCE_M = 20;

function shuttleDurationSec(level: number): number {
  const v = SPEED_KMH[level - 1];
  return (SHUTTLE_DISTANCE_M / (v * 1000)) * 3600;
}

export function BleepTest({ onResult, results, onBack }: Props) {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [level, setLevel] = useState(1);
  const [shuttle, setShuttle] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalLevel, setFinalLevel] = useState<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nextBeepAtRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close();
    };
  }, []);

  const beep = (freq: number, durMs: number) => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durMs / 1000 + 0.05);
  };

  const tick = () => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    setElapsedMs(elapsed);

    if (now >= nextBeepAtRef.current) {
      let curLevel = level;
      let curShuttle = shuttle;
      curShuttle += 1;
      const newLevel = SHUTTLES_PER_LEVEL[curLevel - 1] ?? 16;
      const isLevelUp = curShuttle >= newLevel;
      if (isLevelUp) {
        curLevel += 1;
        curShuttle = 0;
        beep(1200, 250);
        beep(1200, 250);
      } else {
        beep(880, 150);
      }
      setLevel(curLevel);
      setShuttle(curShuttle);
      if (curLevel > 21) {
        setFinalLevel(21);
        setPhase("done");
        return;
      }
      const dur = shuttleDurationSec(curLevel);
      nextBeepAtRef.current = now + dur * 1000;
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
    setLevel(1);
    setShuttle(0);
    setElapsedMs(0);
    setPhase("running");
    setFinalLevel(null);
    startTimeRef.current = performance.now();
    beep(440, 200);
    setTimeout(() => beep(440, 200), 1000);
    setTimeout(() => beep(440, 200), 2000);
    setTimeout(() => {
      beep(880, 400);
      startTimeRef.current = performance.now();
      nextBeepAtRef.current = performance.now() + shuttleDurationSec(1) * 1000;
      rafRef.current = requestAnimationFrame(tick);
    }, 3000);
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const reached = level + shuttle / Math.max(1, SHUTTLES_PER_LEVEL[level - 1] ?? 16);
    const rounded = Math.round(reached * 10) / 10;
    setFinalLevel(rounded);
    setPhase("done");
  };

  const log = () => {
    if (finalLevel == null) return;
    onResult(finalLevel);
    setPhase("idle");
  };

  return (
    <div data-route="bleep" className="page-rise pt-8 pb-16">
      <button onClick={onBack} className="btn btn-ghost mb-6 -ml-3">
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
          <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>

      <header className="mb-12">
        <div className="eyebrow mb-4">Multi-stage fitness test</div>
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold tracking-[-0.045em] leading-[0.98]">
          The bleep test.
        </h1>
        <p className="mt-5 text-[var(--color-text-dim)] max-w-[60ch] text-[15px] leading-relaxed">
          20 m shuttle. Run from one marker to the other before each beep. Pass mark <span className="text-[var(--color-text)] font-medium tnum">11.5</span>.
          Commando-pass-rate target <span style={{ color: "var(--color-accent)" }} className="font-medium tnum">12.0+</span>.
          Headphones recommended.
        </p>
      </header>

      <div className="surface p-10 text-center">
        {phase === "idle" && (
          <div className="space-y-6">
            <div className="eyebrow">Ready</div>
            <button onClick={start} className="btn btn-primary text-base px-8 py-4">
              Begin test
            </button>
          </div>
        )}

        {phase === "running" && (
          <div className="space-y-6">
            <div className="eyebrow">Level · Shuttle</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="stat-num tnum" style={{ fontSize: "clamp(5rem, 18vw, 8rem)" }}>{level}</span>
              <span className="stat-num tnum text-[var(--color-text-mute)]" style={{ fontSize: "clamp(2rem, 7vw, 3rem)" }}>.{shuttle}</span>
            </div>
            <div className="tnum text-[var(--color-text-mute)]">
              {Math.round(elapsedMs / 1000)}s · {SPEED_KMH[level - 1]?.toFixed(1)} km/h
            </div>
            <button onClick={stop} className="btn btn-secondary">
              Missed two beeps — stop
            </button>
          </div>
        )}

        {phase === "done" && finalLevel !== null && (
          <div className="space-y-6">
            <div className="eyebrow">Final level</div>
            <div className="stat-num tnum" style={{ fontSize: "clamp(5rem, 18vw, 8rem)" }}>{finalLevel}</div>
            <div className="text-[15px]" style={{ color: finalLevel >= 12 ? "var(--color-accent)" : finalLevel >= 11.5 ? "var(--color-rm-green-hi)" : "var(--color-danger)" }}>
              {finalLevel >= 12 ? "Commando-rate target met" : finalLevel >= 11.5 ? "Entrance pass" : `${(11.5 - finalLevel).toFixed(1)} below pass`}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={log} className="btn btn-done">Log result</button>
              <button onClick={() => setPhase("idle")} className="btn btn-secondary">Discard</button>
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <section className="mt-12">
          <div className="eyebrow mb-4">History</div>
          <ul className="space-y-2.5">
            {[...results].reverse().map((r, i) => {
              const isPass = r.level >= 11.5;
              const isTarget = r.level >= 12;
              return (
                <li key={i} className="tile px-5 py-4 flex items-baseline justify-between">
                  <span className="text-[var(--color-text-dim)] tnum">{r.date}</span>
                  <span className="flex items-baseline gap-3">
                    {isTarget && <span className="eyebrow" style={{ color: "var(--color-gold)" }}>Target</span>}
                    {!isTarget && isPass && <span className="eyebrow" style={{ color: "var(--color-rm-green-hi)" }}>Pass</span>}
                    {!isPass && <span className="eyebrow" style={{ color: "var(--color-red-hi)" }}>Below</span>}
                    <span className="stat-num tnum text-[1.75rem]">{r.level}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
