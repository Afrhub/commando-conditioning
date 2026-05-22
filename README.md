# Commando Conditioning

12-week PWA training programme to take a candidate from current state to Royal Marines entrance test pass standards.

## What it does

Intake your current scores → generates a per-day schedule covering:

- **Press / sit / pull** — regain method (+1 rep daily for press & sit, weekly for pull), 3 sets
- **Run** — LISS (build to 7 mi) + HIIT (build to 14 × 400 m, 1 min rest)
- **Swim** — ladder from current lengths to 1 mile continuous, 1 min rest
- **S&C** — 2× / week, posterior chain + core
- **Conditioning** — circuits (jump squats, lunge jumps, burpees) increasing in volume
- **Self-test days** — every 3 weeks (RMFT + bleep test)

Plus a built-in bleep test player (Web Audio — no MP3s required).

## Targets

| Element | Pass | Commando-rate target |
|---|---|---|
| Press-ups | 40 | 60 |
| Sit-ups | 50 | 85 |
| Pull-ups (beam) | 5 | 16 |
| 1.5 mi run | 10:30 | 10:00 |
| Bleep test | 11.5 | 12.0+ |
| Swim | 1 mile continuous | 1 mile continuous |

## Stack

Vite · React 18 · TypeScript · Tailwind v4 · vite-plugin-pwa.
LocalStorage persistence. No backend.

## Development

```bash
npm install
npm run dev       # localhost:5173
npm run build     # dist/
npm run preview   # serve dist/
```

## Deploy

Static — push `dist/` to any static host. No backend required.

**Live (GitHub Pages):** https://afrhub.github.io/commando-conditioning/

Auto-deploys on push to `main` via `.github/workflows/deploy.yml`.

## Roadmap (v2)

- Weighting: down-tune strong elements, up-tune weak ones
- Adaptive replan after each 3-week self-test
- Bleep test audio synced to standard MSFT tables (already implemented via Web Audio)
- Optional cloud sync
