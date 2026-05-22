interface Props {
  view: { kind: string };
  onHome: () => void;
  onBleep: () => void;
  onReset: () => void;
  hasProgramme: boolean;
}

export function Header({ onHome, onBleep, onReset, hasProgramme }: Props) {
  return (
    <header className="header-surface sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center gap-4">
        <button onClick={onHome} className="flex items-center gap-3 group min-h-[44px]" aria-label="Go home">
          <span className="relative h-10 w-10 grid place-items-center">
            <img
              src="/brand/logo.png"
              alt=""
              aria-hidden="true"
              onError={e => { (e.currentTarget as HTMLImageElement).src = "/brand/logo.svg"; }}
              className="h-10 w-10 invert opacity-95 transition-opacity duration-200 group-hover:opacity-100"
              style={{ filter: "invert(1)" }}
            />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: "var(--color-rm-gold)" }}>Royal Marines</span>
            <span
              className="font-display mt-1.5 text-[15px]"
              style={{
                fontVariationSettings: '"wdth" 80',
                fontWeight: 900,
                letterSpacing: "-0.005em",
              }}
            >
              COMMANDO CONDITIONING
            </span>
          </span>
        </button>
        <div className="flex-1" />
        <button onClick={onBleep} className="btn btn-secondary">
          Bleep test
        </button>
        {hasProgramme && (
          <button onClick={onReset} className="btn btn-ghost" title="Reset all progress">
            Reset
          </button>
        )}
      </div>
    </header>
  );
}
