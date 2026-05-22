import { useEffect, useState } from "react";

/**
 * useCounter: animate a value from 0 to target over duration on mount.
 * Uses ease-out-strong curve, rAF-driven, respects prefers-reduced-motion.
 */
export function useCounter(target: number, duration = 900): number {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return target;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? target : 0;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const easeOutStrong = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutStrong(t);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
