import { useEffect } from "react";

/**
 * Cinema: ambient background + reveal-on-scroll + reading progress + card parallax.
 * - Aurora + 5 drifting orbs + grid + vignette layers, fixed behind everything.
 * - 2px reading-progress bar pinned top, scaleX driven by scroll.
 * - IntersectionObserver tags [data-reveal] elements, stagger-cap 360ms.
 * - Scroll-parallax on aurora + orbs (separate speeds) AND on .tile elements.
 * - Pointer-tilt 3D parallax on .tile-interactive cards (mouse tracking, rotateX/Y + scale).
 * - Honours prefers-reduced-motion.
 */
export function Cinema() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── 1. Inject background DOM
    let bg = document.querySelector<HTMLDivElement>(".cinema-bg");
    if (!bg) {
      bg = document.createElement("div");
      bg.className = "cinema-bg";
      bg.setAttribute("aria-hidden", "true");
      bg.innerHTML = `
        <div class="cinema-parallax" data-parallax-speed="0.08">
          <div class="cinema-aurora"></div>
        </div>
        <div class="cinema-parallax" data-parallax-speed="0.20">
          <div class="cinema-orbs">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
            <div class="orb orb-4"></div>
            <div class="orb orb-5"></div>
          </div>
        </div>
        <div class="cinema-grid" data-parallax-speed="0.04"></div>
        <div class="cinema-vignette"></div>
      `;
      document.body.insertBefore(bg, document.body.firstChild);
    }

    let bar = document.querySelector<HTMLDivElement>(".reading-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "reading-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
    }

    // ── 2. Tag + observe reveal targets
    const REVEAL_SELECTORS = [
      "main [data-route] h1",
      "main [data-route] header",
      "main [data-route] section",
      "main [data-route] .surface",
      "main [data-route] .tile",
      ".module-card",
    ];

    const tagReveals = () => {
      if (reduceMotion) return;
      REVEAL_SELECTORS.forEach(sel => {
        const nodes = document.querySelectorAll<HTMLElement>(sel);
        let seenInGroup = 0;
        let lastParent: Element | null = null;
        nodes.forEach(el => {
          if (el.hasAttribute("data-reveal")) return;
          el.setAttribute("data-reveal", "");
          if (el.parentElement === lastParent) {
            seenInGroup++;
          } else {
            seenInGroup = 0;
            lastParent = el.parentElement;
          }
          if (seenInGroup > 0) {
            const delay = Math.min(seenInGroup * 55, 360);
            el.style.transitionDelay = `${delay}ms`;
          }
        });
      });
    };

    const revealAll = () => {
      document.querySelectorAll("[data-reveal]").forEach(el => el.classList.add("is-revealed"));
    };

    // ── 3. Scroll-parallax tagging on cards (subtle Y-drift)
    const tagCardParallax = () => {
      if (reduceMotion) return;
      // Hero stats — strongest, lifts up as you scroll
      document.querySelectorAll<HTMLElement>("main [data-route] header .surface").forEach(el => {
        if (!el.hasAttribute("data-card-parallax")) {
          el.setAttribute("data-card-parallax", "0.10");
        }
      });
      // Day cells — medium
      document.querySelectorAll<HTMLElement>("main [data-route] section .tile").forEach(el => {
        if (!el.hasAttribute("data-card-parallax")) {
          el.setAttribute("data-card-parallax", String(0.04 + Math.random() * 0.04));
        }
      });
      // Big session blocks
      document.querySelectorAll<HTMLElement>("main [data-route] .stagger > .tile").forEach(el => {
        if (!el.hasAttribute("data-card-parallax")) {
          el.setAttribute("data-card-parallax", "0.06");
        }
      });
    };

    let io: IntersectionObserver | null = null;
    const setupObserver = () => {
      tagReveals();
      tagCardParallax();
      attachTilt();
      if (reduceMotion || !("IntersectionObserver" in window)) {
        revealAll();
        return;
      }
      io = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              io!.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
      );
      document.querySelectorAll("[data-reveal]").forEach(el => io!.observe(el));
    };

    // ── 4. Pointer-tilt 3D parallax on interactive tiles
    const tiltState = new WeakMap<HTMLElement, { rx: number; ry: number; tx: number; ty: number; raf: number | null }>();

    const handleTilt = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * 10; // -5..5 deg
      const ry = (x - 0.5) * 14; // -7..7 deg
      const tx = (x - 0.5) * 6;
      const ty = (y - 0.5) * 6;
      animateTilt(el, rx, ry, tx, ty);
    };

    const resetTilt = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      animateTilt(el, 0, 0, 0, 0);
    };

    const animateTilt = (el: HTMLElement, rx: number, ry: number, tx: number, ty: number) => {
      const state = tiltState.get(el) || { rx: 0, ry: 0, tx: 0, ty: 0, raf: null };
      const target = { rx, ry, tx, ty };
      if (state.raf) cancelAnimationFrame(state.raf);

      const step = () => {
        state.rx += (target.rx - state.rx) * 0.15;
        state.ry += (target.ry - state.ry) * 0.15;
        state.tx += (target.tx - state.tx) * 0.15;
        state.ty += (target.ty - state.ty) * 0.15;
        el.style.setProperty("--tilt-rx", `${state.rx.toFixed(2)}deg`);
        el.style.setProperty("--tilt-ry", `${state.ry.toFixed(2)}deg`);
        el.style.setProperty("--tilt-tx", `${state.tx.toFixed(2)}px`);
        el.style.setProperty("--tilt-ty", `${state.ty.toFixed(2)}px`);
        const dx = Math.abs(target.rx - state.rx) + Math.abs(target.ry - state.ry);
        if (dx > 0.05) {
          state.raf = requestAnimationFrame(step);
        } else {
          state.raf = null;
          if (target.rx === 0 && target.ry === 0) {
            el.style.removeProperty("--tilt-rx");
            el.style.removeProperty("--tilt-ry");
            el.style.removeProperty("--tilt-tx");
            el.style.removeProperty("--tilt-ty");
          }
        }
        tiltState.set(el, state);
      };
      state.raf = requestAnimationFrame(step);
      tiltState.set(el, state);
    };

    const attachedTilts = new WeakSet<HTMLElement>();
    const attachTilt = () => {
      if (reduceMotion) return;
      // Only attach on pointer:fine (desktop/laptop)
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      document.querySelectorAll<HTMLElement>("main [data-route] .tile-interactive").forEach(el => {
        if (attachedTilts.has(el)) return;
        attachedTilts.add(el);
        el.classList.add("tile-tilt");
        el.addEventListener("pointermove", handleTilt as EventListener);
        el.addEventListener("pointerleave", resetTilt as EventListener);
        el.addEventListener("pointercancel", resetTilt as EventListener);
      });
    };

    // Re-tag on route changes (App re-mounts content)
    const mo = new MutationObserver(() => {
      setupObserver();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    setupObserver();

    // ── 5. Scroll handler: bg parallax + card scroll parallax + reading progress
    let bgEls = Array.from(document.querySelectorAll<HTMLElement>(".cinema-bg [data-parallax-speed]"));
    let ticking = false;

    const readAndWrite = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop;

      if (!reduceMotion) {
        // BG parallax (existing)
        for (const el of bgEls) {
          const speed = parseFloat(el.getAttribute("data-parallax-speed") || "0");
          el.style.transform = `translate3d(0,${(y * speed * -1).toFixed(2)}px,0)`;
        }
        // Per-card parallax — viewport-relative for smooth in/out
        const vh = window.innerHeight;
        document.querySelectorAll<HTMLElement>("[data-card-parallax]").forEach(el => {
          const rect = el.getBoundingClientRect();
          const speed = parseFloat(el.getAttribute("data-card-parallax") || "0");
          // 0 when card center is at viewport center; +/- as it scrolls past
          const center = rect.top + rect.height / 2;
          const offset = (center - vh / 2) * speed;
          el.style.setProperty("--scroll-y", `${(-offset).toFixed(2)}px`);
        });
      }
      if (bar) {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docH > 0 ? Math.min(1, Math.max(0, y / docH)) : 0;
        bar.style.transform = `scaleX(${progress.toFixed(4)})`;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(readAndWrite);
        ticking = true;
      }
    };

    // Refresh bg refs after MutationObserver inserts (rare)
    const refreshBgEls = () => {
      bgEls = Array.from(document.querySelectorAll<HTMLElement>(".cinema-bg [data-parallax-speed]"));
    };
    refreshBgEls();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    readAndWrite();

    return () => {
      mo.disconnect();
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
