# Commando Conditioning — Project Doctrine

> **Status:** LOCKED · 2026-05-22 · source-of-truth
> Every feature, content choice, and design decision must move toward taking a
> civilian from current state to Royal Marines entrance test pass standards
> in a 12-week (or 8/10) programme. If it doesn't, drop it or defer it.
>
> Canonical version: this file (`~/.openclaw/workspace/commando-conditioning/DOCTRINE.md`).
> Memory mirror: `~/.claude/projects/C--/memory/commando_doctrine.md` — keep in sync.

---

## North star

**Take a civilian from where they are to Royal Marines entrance test passes — in 12 weeks.**

Honest scores in. Daily protocol out. No coaching tone, no streak-mining, no
gamification. The user already self-selected for this; the app's job is to
respect that and show them the work.

Every feature must answer: does this get a candidate closer to passing on
test day? If not, drop it.

---

## Product

PWA. Vite + React + TypeScript + Tailwind v4 + vite-plugin-pwa. LocalStorage
persistence. No backend. Static deploy (Netlify + GitHub Pages mirrors).

Three permanent surfaces:
1. **Spine landing** — F-S dagger as central spine, 6 orbit boxes, scroll-driven rotation
2. **Programme schedule** — week grid + day tiles + per-session detail
3. **Bleep test** — Web Audio MSFT shuttle, level 1-21

---

## Inputs (intake form)

- Age, weight (kg), height (cm)
- Max press-ups (1 set to failure)
- Max sit-ups (1 set to failure, 2 min)
- Max pull-ups (1 set to failure, on beam preferred)
- 1.5 mile best-effort time (mm:ss)
- Pool length (m, for swim plan scaling)
- Lengths swum continuously without stopping
- Programme length preference (8/10/12 weeks — auto-recommend by weakness profile)

## Pass standards (target)

| Element | Min pass | Target (commando pass rate) |
|---|---|---|
| Press-ups | 40 | 60 |
| Sit-ups | 50 | 85 |
| Pull-ups (beam) | 5 | 16 |
| 1.5 mile | ≤10:30 | ≤10:00 |
| Bleep test (multi-stage) | 11.5 | ≥12.0 |
| Swim | 1 mile continuous | 1 mile continuous |

## Training protocols

**Press / Sit / Pull (regain method):**
- 3 sets daily, 6 days/week
- Press-ups & sit-ups: +1 rep to one set per day
- Pull-ups: +1 rep to one set per week (harder)

**Run (VO2 max focus):**
- LISS: start 1.5 mi, build to 7 mi over programme
- HIIT: 400 m reps, 1 min rest between, reps 6 → 14

**Swim (ladder method):**
- Start at current max lengths × 10 reps, 1 min rest
- Each session: +1 length per rep until 1 mile continuous

**S&C (2×/week):**
- Posterior chain (run support): RDL, hip thrust, single-leg deadlift
- Core (robustness): plank variations, hollow holds, dead bug, ab wheel

**Conditioning (mental/physical robustness):**
- Jump squats, lunge jumps, burpees, mountain climbers, sprint intervals

## Programme structure rules

- 12 weeks default; 8 or 10 weeks if start scores are high
- Days may combine: press/sit/pull + run; swim + press/sit/pull; S&C + conditioning; etc.
- One or two sessions per day max
- Rest day: 1 per week minimum
- Self-test day every 3 weeks (RMFT + bleep)

---

## Iteration 2 (not v1)

- Weighting: down-tune strong areas, up-tune weak areas
- Adaptive replan after periodic self-test (RMFT bleep)
- Optional cloud sync
- Custom domain

## Iteration 3+ (out of scope until v1 customer-zero validated)

- Group / cohort mode
- Coach-in-the-loop messaging
- Sponsorship / sponsoring service

---

## Brand identifiers

See [commando_brand.md](../../.claude/projects/C--/memory/commando_brand.md) for the full spec. Summary:

- **Primary logo:** plate carrier inside circle, white stencil wordmark, commando dagger replaces A in COMMANDO and T in CONDITIONING. `public/brand/logo.png` + `.svg` fallback.
- **Wordmark:** text-only. `public/brand/wordmark.png` + `.svg`.
- **Palette (cap-badge heraldry):** olive green field bg + RM gold accent + laurel green + globe blue + scroll red + scroll cream white.
- **Fonts:** Anybody (display, variable wdth), Big Shoulders Display (numerals), Manrope (body), Special Elite (mono labels).
- **Voice:** terse, military-clinical, unsentimental. No fluff, no exclamation marks.

---

## Built-in tests

- Bleep test (multi-stage shuttle): Web Audio synthesised beeps using standard MSFT level 1-21 speed table. Level published as numeric result.
- RMFT self-test: every 3 weeks. Press / sit / pull / 1.5 mi for time + optional bleep.

---

## Distribution

- **GitHub repo:** https://github.com/Afrhub/commando-conditioning (public, default `main`)
- **GitHub Pages:** https://afrhub.github.io/commando-conditioning/
- **Netlify:** https://commandoconditioning.netlify.app
- **No custom domain yet.**

---

## Customer-zero rule

User is not enlisting. Need a real candidate in the user's network to test the
programme through to test day. Until that happens, don't add iteration 2 weighting
logic — first prove the doctrine works on one person.
