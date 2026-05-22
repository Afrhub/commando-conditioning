import { useEffect, useRef, useState } from "react";
import { Programme, Day } from "../lib/programme";
import { dayKey } from "../lib/storage";
import { useCounter } from "../lib/useCounter";

interface Props {
  programme: Programme;
  completed: Record<string, boolean>;
  onOpenDay: (week: number, dayIdx: number) => void;
  onEditIntake: () => void;
}

export function Schedule({ programme, completed, onOpenDay, onEditIntake }: Props) {
  const totalDays = programme.days.filter(d => d.sessions.length > 0).length;
  const doneDays = programme.days.filter(d => completed[dayKey(d.week, d.dayIdx)]).length;
  const pct = totalDays === 0 ? 0 : Math.round((doneDays / totalDays) * 100);
  const weeksLeft = weeksRemaining(programme, completed);
  const currentWeek = currentWeekFromCompleted(programme, completed);

  const weeks: Day[][] = [];
  for (let w = 1; w <= programme.weeks; w++) {
    weeks.push(programme.days.filter(d => d.week === w));
  }

  return (
    <div data-route="schedule" className="page-rise pt-10 pb-16 relative">
      <ScrollRail currentWeek={currentWeek} totalWeeks={programme.weeks} />

      <header className="mb-14 relative">
        {/* Diagonal printed ID stamp */}
        <div className="absolute -top-2 right-0 font-mono text-[10px] uppercase tracking-widest opacity-50" style={{ color: "var(--color-text-mute)" }}>
          ⁂ Brief · 01 / 12W
        </div>

        <div className="flex items-baseline justify-between gap-6">
          <div>
            <div className="eyebrow eyebrow-offset mb-5">PROGRAMME · {programme.weeks} WEEKS</div>
            <h1
              className="font-display"
              style={{
                fontSize: "clamp(2.75rem, 9vw, 6.5rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.045em",
                fontVariationSettings: '"wdth" 88',
                fontWeight: 900,
                maxWidth: "12ch",
              }}
            >
              The work,<br />
              <span style={{ color: "var(--color-text-mute)" }}>laid out.</span>
            </h1>
          </div>
          <button onClick={onEditIntake} className="btn btn-ghost shrink-0" aria-label="Edit baseline scores">
            Edit baseline
          </button>
        </div>

        {/* Hero stat row — oversized scoreboard numerals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-14">
          <HeroStat label="Sessions Done" current={doneDays} total={totalDays} />
          <HeroStat label="Progress" current={pct} total={100} suffix="%" mega />
          <HeroStat label="Weeks Remaining" current={weeksLeft} total={programme.weeks} />
        </div>

        <div className="h-[3px] bg-[color:var(--color-hairline)] rounded-full mt-10 overflow-hidden relative">
          <div
            className="h-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--color-rm-green) 0%, var(--color-rm-green-hi) 100%)",
              boxShadow: "0 0 12px var(--color-rm-green-soft)",
              transition: "width var(--dur-slow) var(--ease-out-strong)",
            }}
          />
          <div className="absolute right-0 top-0 -translate-y-full font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--color-text-mute)" }}>
            <span style={{ color: "var(--color-rm-gold)" }}>{pct}</span>% logged
          </div>
        </div>
      </header>

      <div className="stagger space-y-14">
        {weeks.map((days, idx) => (
          <WeekRow
            key={idx}
            week={idx + 1}
            days={days}
            completed={completed}
            onOpenDay={onOpenDay}
          />
        ))}
      </div>
    </div>
  );
}

function weeksRemaining(programme: Programme, completed: Record<string, boolean>): number {
  let r = 0;
  for (let w = 1; w <= programme.weeks; w++) {
    const wDays = programme.days.filter(d => d.week === w && d.sessions.length > 0);
    const wDone = wDays.every(d => completed[dayKey(d.week, d.dayIdx)]);
    if (!wDone) r++;
  }
  return r;
}

function currentWeekFromCompleted(programme: Programme, completed: Record<string, boolean>): number {
  for (let w = 1; w <= programme.weeks; w++) {
    const wDays = programme.days.filter(d => d.week === w && d.sessions.length > 0);
    const wDone = wDays.every(d => completed[dayKey(d.week, d.dayIdx)]);
    if (!wDone) return w;
  }
  return programme.weeks;
}

function HeroStat({ label, current, total, suffix, mega }: { label: string; current: number; total: number; suffix?: string; mega?: boolean }) {
  const animated = useCounter(current, 900);
  const rendered = Math.round(animated);
  return (
    <div className="surface corner-brackets px-7 py-10 sm:py-12 relative overflow-hidden">
      <div className="eyebrow eyebrow-offset mb-4">{label}</div>
      <div className="flex items-baseline gap-2 relative z-10">
        <span
          className={mega ? "stat-num-mega" : "stat-num"}
          style={{
            fontSize: mega ? "clamp(4.5rem, 13vw, 7rem)" : "clamp(3.5rem, 10vw, 5.5rem)",
          }}
        >
          {rendered}{suffix ?? ""}
        </span>
        <span className="font-mono text-[12px] tracking-widest uppercase tnum" style={{ color: "var(--color-text-mute)" }}>
          / {total}{suffix ?? ""}
        </span>
      </div>
      <span className="bg-num" aria-hidden>{total}</span>
    </div>
  );
}

function WeekRow({
  week,
  days,
  completed,
  onOpenDay,
}: {
  week: number;
  days: Day[];
  completed: Record<string, boolean>;
  onOpenDay: (w: number, d: number) => void;
}) {
  const allDone = days.filter(d => d.sessions.length > 0).every(d => completed[dayKey(d.week, d.dayIdx)]);
  return (
    <section>
      <div className="flex items-baseline justify-between mb-5">
        <div className="flex items-baseline gap-4">
          <div className="eyebrow eyebrow-offset">WEEK</div>
          <div
            className="stat-num tnum"
            style={{
              fontSize: "2.5rem",
              fontVariationSettings: '"wdth" 75',
              color: "var(--color-text)",
            }}
          >
            {String(week).padStart(2, "0")}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-mute)" }}>
            / {String(days.filter(d => d.sessions.length > 0).length).padStart(2, "0")} blocks
          </div>
        </div>
        {allDone && (
          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--color-rm-green-hi)" }}>
            ✓ Complete
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
        {days.map(day => (
          <DayCell
            key={day.dayIdx}
            day={day}
            done={!!completed[dayKey(day.week, day.dayIdx)]}
            onClick={() => onOpenDay(day.week, day.dayIdx)}
          />
        ))}
      </div>
    </section>
  );
}

function DayCell({ day, done, onClick }: { day: Day; done: boolean; onClick: () => void }) {
  const isRest = day.sessions.length === 0;
  const isTest = day.isTestDay;

  const cls = ["tile", "aspect-[1/1.15]", "p-3", "sm:p-4", "flex", "flex-col", "justify-between"];
  if (isRest) cls.push("tile-rest");
  else cls.push("tile-interactive");
  if (done) cls.push("tile-done");
  else if (isTest) cls.push("tile-accent");

  return (
    <button
      onClick={onClick}
      disabled={isRest}
      className={cls.join(" ")}
      aria-label={`${day.label} week ${day.week}${isRest ? " rest" : isTest ? " test day" : ""}${done ? " complete" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div
          className="font-mono text-[10px] tracking-wider uppercase"
          style={{ color: isTest ? "var(--color-red-hi)" : "var(--color-text-mute)" }}
        >
          {day.label}
        </div>
        {done && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" style={{ color: "var(--color-rm-green-hi)" }} aria-hidden>
            <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="text-left">
        {isRest ? (
          <div className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "var(--color-text-mute)" }}>Rest</div>
        ) : isTest ? (
          <span className="stamp">TEST</span>
        ) : (
          <div className="flex flex-wrap gap-x-1 gap-y-0.5 font-mono">
            {day.sessions.slice(0, 4).map((s, i) => (
              <span
                key={i}
                className="text-[10px] font-bold tracking-wider"
                style={{
                  color: s.discipline === "swim"
                    ? "var(--color-rm-blue-hi)"
                    : s.discipline === "run-liss" || s.discipline === "run-hiit"
                      ? "var(--color-rm-gold)"
                      : "var(--color-text-dim)",
                }}
              >
                {disciplineGlyph(s.discipline)}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function disciplineGlyph(d: string): string {
  switch (d) {
    case "press": return "PR";
    case "sit": return "ST";
    case "pull": return "PU";
    case "run-liss": return "RUN";
    case "run-hiit": return "HR";
    case "swim": return "SW";
    case "sandc": return "S&C";
    case "conditioning": return "CD";
    case "test": return "★";
    default: return "·";
  }
}

function ScrollRail({ currentWeek, totalWeeks }: { currentWeek: number; totalWeeks: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible((window.scrollY || 0) > 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={ref} className={`scroll-rail ${visible ? "is-visible" : ""}`} aria-hidden>
      <span className="rail-label">WK</span>
      <span className="rail-value tnum">{String(currentWeek).padStart(2, "0")}</span>
      <span className="rail-label">/ OF {String(totalWeeks).padStart(2, "0")}</span>
    </div>
  );
}
