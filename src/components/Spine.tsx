import { useEffect, useRef, useState } from "react";

export interface SpineSection {
  id: string;
  eyebrow: string;
  title: string;
  detail: string;
  cta: string;
  accent?: "gold" | "green" | "red" | "blue" | "white";
  onActivate: () => void;
}

interface Props {
  sections: SpineSection[];
}

/**
 * Spine: Fairbairn-Sykes dagger as central spine. Section boxes orbit around it
 * on a helix path, scroll drives rotation. Click a box → calls its onActivate.
 *
 * Implementation:
 * - Page is N × 100vh tall (N = sections.length + 1) to give scroll room.
 * - The .spine-stage is sticky/fixed full viewport.
 * - --scroll-progress (0..1) drives rotation + per-box visibility.
 * - Each box positioned via rotateY(baseAngle + progress*360) translateZ(radius) + translateY.
 * - Closest-to-camera box gets highlighted ("active" class) and pulled forward.
 * - Click any box → un-orbits with a scale-up animation, then fires onActivate.
 */
export function Spine({ sections }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [enteringIdx, setEnteringIdx] = useState<number | null>(null);

  const N = sections.length;
  const SCROLL_PAGES = N + 1; // vh multiples of scroll runway

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;

    const update = () => {
      const wrap = wrapRef.current;
      const stage = stageRef.current;
      if (!wrap || !stage) {
        ticking = false;
        return;
      }
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalScrollable = rect.height - vh;
      const scrolled = Math.max(0, Math.min(totalScrollable, -rect.top));
      const progress = totalScrollable > 0 ? scrolled / totalScrollable : 0;
      stage.style.setProperty("--scroll-progress", String(progress));

      // Determine active section (closest to front)
      // Each section sits at base angle (i * 360/N) and orbits with progress*360
      // Front of stage = 0deg net rotation (mod 360)
      const baseStep = 360 / N;
      let bestIdx = 0;
      let bestScore = Infinity;
      for (let i = 0; i < N; i++) {
        const baseAngle = i * baseStep;
        const yaw = (baseAngle + progress * 360) % 360;
        const dist = Math.min(yaw, 360 - yaw); // 0..180
        if (dist < bestScore) {
          bestScore = dist;
          bestIdx = i;
        }
      }
      setActiveIdx(bestIdx);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    if (reduce) {
      // Snap to first section, no scroll behaviour
      if (stageRef.current) stageRef.current.style.setProperty("--scroll-progress", "0");
      setActiveIdx(0);
    } else {
      update();
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [N]);

  const handleActivate = (idx: number) => {
    setEnteringIdx(idx);
    setTimeout(() => {
      sections[idx].onActivate();
    }, 480);
  };

  return (
    <div
      ref={wrapRef}
      className="spine-wrap"
      style={{ height: `${SCROLL_PAGES * 100}vh` }}
    >
      <div ref={stageRef} className="spine-stage" aria-hidden={enteringIdx !== null}>
        {/* Dagger spine */}
        <div className="spine-dagger-wrap">
          <img
            src="/brand/dagger.svg"
            alt=""
            aria-hidden
            className="spine-dagger"
            draggable={false}
          />
        </div>

        {/* Orbit boxes */}
        <div className="spine-orbit">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={[
                "spine-box",
                `spine-box-accent-${s.accent ?? "gold"}`,
                activeIdx === i ? "is-active" : "",
                enteringIdx === i ? "is-entering" : "",
                enteringIdx !== null && enteringIdx !== i ? "is-fleeing" : "",
              ].join(" ")}
              style={{
                ["--base-angle" as never]: `${(i * 360) / N}deg`,
                ["--vertical-offset" as never]: `${(i - (N - 1) / 2) * 14}vh`,
              }}
              onClick={() => handleActivate(i)}
            >
              <div className="spine-box-eyebrow">{s.eyebrow}</div>
              <div className="spine-box-title">{s.title}</div>
              <div className="spine-box-detail">{s.detail}</div>
              <div className="spine-box-cta">
                {s.cta}
                <svg viewBox="0 0 16 16" className="h-3 w-3 inline-block ml-1.5" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Scroll hint */}
        {activeIdx === 0 && (
          <div className="spine-scroll-hint" aria-hidden>
            <span>scroll</span>
            <svg viewBox="0 0 16 16" className="h-4 w-4">
              <path d="M8 3v10M4 9l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Section pip indicator */}
        <div className="spine-pips" aria-hidden>
          {sections.map((s, i) => (
            <span
              key={s.id}
              className={`spine-pip ${activeIdx === i ? "is-active" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
