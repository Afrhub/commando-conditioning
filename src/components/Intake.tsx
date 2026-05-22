import { useState } from "react";
import { IntakeScores, formatSeconds, parseTimeToSec, STANDARDS } from "../lib/standards";
import { generateProgramme, Programme } from "../lib/programme";

interface Props {
  initial: IntakeScores | null;
  onSubmit: (scores: IntakeScores, programme: Programme) => void;
}

const DEFAULTS: IntakeScores = {
  age: 22,
  weightKg: 75,
  heightCm: 180,
  pressUps: 25,
  sitUps: 35,
  pullUps: 3,
  runMileAndHalfSec: 720,
  poolLengthM: 25,
  swimLengths: 2,
};

export function Intake({ initial, onSubmit }: Props) {
  const [s, setS] = useState<IntakeScores>(initial ?? DEFAULTS);
  const [runStr, setRunStr] = useState(formatSeconds((initial ?? DEFAULTS).runMileAndHalfSec));

  const set = <K extends keyof IntakeScores>(k: K, v: IntakeScores[K]) => setS(prev => ({ ...prev, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const scores = { ...s, runMileAndHalfSec: parseTimeToSec(runStr) };
    const programme = generateProgramme(scores);
    onSubmit(scores, programme);
  };

  return (
    <form onSubmit={submit} data-route="intake" className="page-rise pt-10 pb-16">
      <header className="mb-12 relative">
        <div className="absolute -top-2 right-0 font-mono text-[10px] uppercase tracking-widest opacity-50" style={{ color: "var(--color-text-mute)" }}>
          ⁂ Form 0 · Intake
        </div>
        <div className="eyebrow eyebrow-offset mb-5">PHASE 0 · BASELINE</div>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(2.5rem, 8.5vw, 6rem)",
            lineHeight: 0.88,
            letterSpacing: "-0.045em",
            fontVariationSettings: '"wdth" 88',
            fontWeight: 900,
            maxWidth: "14ch",
          }}
        >
          Where you stand,<br />
          <span style={{ color: "var(--color-text-mute)" }}>before the work begins.</span>
        </h1>
        <p className="mt-6 text-[var(--color-text-dim)] max-w-[60ch] text-[15px] leading-[1.7]">
          Honest numbers in. We build from your current state to entrance pass standards —
          press <strong className="text-[var(--color-text)] tnum">{STANDARDS.pressUps.pass}</strong>,{" "}
          sit <strong className="text-[var(--color-text)] tnum">{STANDARDS.sitUps.pass}</strong>,{" "}
          pull <strong className="text-[var(--color-text)] tnum">{STANDARDS.pullUps.pass}</strong>,{" "}
          1.5 mi ≤ <strong className="text-[var(--color-text)] tnum">10:30</strong>,{" "}
          bleep ≥ <strong className="text-[var(--color-text)] tnum">12</strong>.
        </p>
      </header>

      <div className="stagger space-y-8">
        <Section title="Body">
          <Field label="Age">
            <NumInput value={s.age} onChange={v => set("age", v)} min={16} max={60} />
          </Field>
          <Field label="Weight (kg)">
            <NumInput value={s.weightKg} onChange={v => set("weightKg", v)} min={40} max={200} step={0.5} />
          </Field>
          <Field label="Height (cm)">
            <NumInput value={s.heightCm} onChange={v => set("heightCm", v)} min={140} max={220} />
          </Field>
        </Section>

        <Section title="Bodyweight strength — max single set to failure">
          <Field label="Press-ups">
            <NumInput value={s.pressUps} onChange={v => set("pressUps", v)} min={0} max={150} />
          </Field>
          <Field label="Sit-ups (2 min)">
            <NumInput value={s.sitUps} onChange={v => set("sitUps", v)} min={0} max={150} />
          </Field>
          <Field label="Pull-ups (beam)">
            <NumInput value={s.pullUps} onChange={v => set("pullUps", v)} min={0} max={40} />
          </Field>
        </Section>

        <Section title="Run">
          <Field label="1.5 mile best effort (mm:ss)">
            <input
              type="text"
              inputMode="numeric"
              placeholder="11:30"
              value={runStr}
              onChange={e => setRunStr(e.target.value)}
              className="field-input tnum"
              style={{ maxWidth: 140 }}
            />
          </Field>
        </Section>

        <Section title="Swim">
          <Field label="Pool length (m)">
            <NumInput value={s.poolLengthM} onChange={v => set("poolLengthM", v)} min={10} max={50} />
          </Field>
          <Field label="Lengths swum non-stop">
            <NumInput value={s.swimLengths} onChange={v => set("swimLengths", v)} min={0} max={64} />
          </Field>
        </Section>
      </div>

      <button type="submit" className="btn btn-primary mt-10 w-full justify-center text-base" style={{ padding: "18px 24px" }}>
        Generate programme
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
          <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface px-6 pt-5 pb-6">
      <div className="eyebrow mb-4">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] text-[var(--color-text-dim)] font-medium">{label}</span>
      {children}
    </label>
  );
}

function NumInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      min={min}
      max={max}
      step={step}
      className="field-input tnum"
    />
  );
}
