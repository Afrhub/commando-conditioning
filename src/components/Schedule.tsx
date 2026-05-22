import { Programme, Day } from "../lib/programme";
import { dayKey } from "../lib/storage";

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

  const weeks: Day[][] = [];
  for (let w = 1; w <= programme.weeks; w++) {
    weeks.push(programme.days.filter(d => d.week === w));
  }

  return (
    <div data-route="schedule" className="page-rise pt-10 pb-16">
      <header className="mb-12">
        <div className="flex items-baseline justify-between gap-6">
          <div>
            <div className="eyebrow mb-4">Programme · {programme.weeks} weeks</div>
            <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold tracking-[-0.045em] leading-[0.98] max-w-[14ch]">
              The work,<br />
              <span style={{ color: "var(--color-text-mute)" }}>laid out.</span>
            </h1>
          </div>
          <button onClick={onEditIntake} className="btn btn-ghost shrink-0" aria-label="Edit baseline scores">
            Edit baseline
          </button>
        </div>

        {/* Hero stat row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-12">
          <HeroStat label="Sessions" current={doneDays} total={totalDays} />
          <HeroStat label="Progress" current={pct} total={100} suffix="%" />
          <HeroStat label="Weeks left" current={weeksRemaining(programme, completed)} total={programme.weeks} />
        </div>

        <div className="h-[2px] bg-[color:var(--color-hairline)] rounded-full mt-8 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--color-rm-green) 0%, var(--color-rm-green-hi) 100%)",
              boxShadow: "0 0 12px var(--color-rm-green-soft)",
              transition: "width var(--dur-slow) var(--ease-out-strong)",
            }}
          />
        </div>
      </header>

      <div className="stagger space-y-10">
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

function HeroStat({ label, current, total, suffix }: { label: string; current: number; total: number; suffix?: string }) {
  return (
    <div className="surface px-5 py-6 relative overflow-hidden">
      <div className="eyebrow mb-3">{label}</div>
      <div className="flex items-baseline gap-2 relative z-10">
        <span className="stat-num tnum text-[clamp(2.25rem,6vw,3.5rem)]">{current}{suffix ?? ""}</span>
        <span className="text-[var(--color-text-mute)] text-sm tnum">/ {total}{suffix ?? ""}</span>
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
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <div className="eyebrow">Week</div>
          <div className="stat-num text-[1.75rem] tnum">{week}</div>
        </div>
        {allDone && <div className="eyebrow" style={{ color: "var(--color-rm-green-hi)" }}>Complete</div>}
      </div>
      <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
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

  const cls = ["tile", "aspect-square", "p-3", "flex", "flex-col", "justify-between"];
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
        <div className="label-quiet" style={{ fontSize: 9 }}>{day.label}</div>
        {isTest && !done && (
          <span
            className="block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-red)" }}
            aria-hidden
          />
        )}
        {done && (
          <svg viewBox="0 0 16 16" className="h-3 w-3" style={{ color: "var(--color-rm-green-hi)" }} aria-hidden>
            <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="text-left">
        {isRest ? (
          <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: "var(--color-text-mute)" }}>Rest</div>
        ) : isTest ? (
          <div className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase" style={{ color: "var(--color-red-hi)" }}>Test</div>
        ) : (
          <div className="flex flex-wrap gap-x-1 gap-y-0.5 font-mono">
            {day.sessions.slice(0, 4).map((s, i) => (
              <span key={i} className="text-[9px] font-semibold tracking-wider" style={{ color: "var(--color-text-dim)" }}>
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
    case "press": return "Pr";
    case "sit": return "St";
    case "pull": return "Pu";
    case "run-liss": return "R";
    case "run-hiit": return "HR";
    case "swim": return "Sw";
    case "sandc": return "S&C";
    case "conditioning": return "Cd";
    case "test": return "★";
    default: return "·";
  }
}
