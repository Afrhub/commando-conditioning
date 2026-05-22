import { useEffect } from "react";

/**
 * Cinema: ambient background + reveal-on-scroll + reading progress.
 * Ported from ai-safe-at-work/assets/cinema.js into React.
 * - Layers a fixed aurora + drifting orbs + grid + vignette behind everything.
 * - Adds 2px gold-green reading-progress bar at top, scaleX bound to scroll.
 * - IntersectionObserver tags [data-reveal] elements, stagger-cap 360ms.
 * - Light parallax on aurora + orbs (separate speeds).
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
        <div class="cinema-parallax" data-parallax-speed="0.05">
          <div class="cinema-aurora"></div>
        </div>
        <div class="cinema-parallax" data-parallax-speed="0.12">
          <div class="cinema-orbs">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
            <div class="orb orb-4"></div>
            <div class="orb orb-5"></div>
          </div>
        </div>
        <div class="cinema-grid"></div>
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

    let io: IntersectionObserver | null = null;
    const setupObserver = () => {
      tagReveals();
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

    // Re-tag on route changes (App re-mounts content)
    const mo = new MutationObserver(() => {
      setupObserver();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    setupObserver();

    // ── 3. Parallax + reading progress
    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax-speed]"));
    let ticking = false;

    const readAndWrite = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop;
      if (!reduceMotion) {
        for (const el of parallaxEls) {
          const speed = parseFloat(el.getAttribute("data-parallax-speed") || "0");
          el.style.transform = `translate3d(0,${(y * speed * -1).toFixed(2)}px,0)`;
        }
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
