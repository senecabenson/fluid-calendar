# Working Notes

> End-of-session handoff log. Future-you reads this cold to re-orient.

## Session-Starter Prompts

**Start any session:**
```
Read CODEBASE_MAP.md, WORKING_NOTES.md (last 2 sessions), and recent
commits on focusflow branch. Summarize: last session work, what's
working, what's broken, the very next concrete task. Don't code yet —
orient me.
```

**When stuck:**
```
I'm stuck on [thing]. Don't fix yet. Ask me 3 clarifying questions to
figure out what I actually need.
```

**End any session (NON-NEGOTIABLE):**
```
Update WORKING_NOTES.md with today's session block: did today, working,
broken, next concrete task. Specific enough that I pick this up cold
in 4 days.
```

## Session template
- **Date:**
- **Phase:**
- **Did today:**
- **Working:**
- **Broken:**
- **Next concrete task:**

---

## 2026-04-29 — Phase 0 kickoff

- **Phase:** 0 (Setup & Codebase Mapping)
- **Did today:**
  - Cloned fork to `~/Coding/fluid-calendar`
  - Added `upstream` remote pointing to `dotnetfactory/fluid-calendar`
  - Created + pushed `focusflow` branch (tracking origin/focusflow)
  - Wrote `.env` with localhost DB URL (override `db` hostname for `npm run dev`)
  - `npm install` — 1237 packages, **39 vulns (1 critical, 15 high, 14 moderate, 9 low)**
  - `npm run db:up` — postgres 16 healthy in fluid-calendar-db-1 container
  - `npx prisma migrate deploy` — all migrations applied (latest: 20250425231923_lifetime_subscription)
  - `npx prisma generate` — Prisma client 6.3.1 (7.8.0 available, defer)
  - `npm run dev` — Next.js 15.3.8 + Turbopack, ready at localhost:3000
  - Created doc scaffolds: CODEBASE_MAP.md, WORKING_NOTES.md, FRICTIONS.md
- **Working:** Dev server localhost:3000, Postgres docker container, Prisma client
- **Broken:** Nothing yet — bugs not yet reproduced
- **Next concrete task:** Phase 0.4 — dispatch 3 parallel Haiku Explore agents to fill CODEBASE_MAP sections (folders+models / API+auth / scheduler+GCal+frontend)

## 2026-05-01 — Phase 0 completion (mapping + health check)

- **Phase:** 0 (Architecture Mapping + Bug Traces + Health Check)
- **Did today:**
  - Ran 3 parallel Explore agents → populated CODEBASE_MAP.md (32 Prisma models, all API routes, scheduler pipeline, GCal sync)
  - Bug 1 trace: initial hypothesis (hardcoded 14-day window) **disproved**. Real cause = `autoSync` UI toggle exists but no timer/cron ever calls `syncAllFeeds()`. Manual sync works; periodic sync is dead code. Fix = wire a setInterval or cron to call `syncAllFeeds()` when `autoSync` enabled.
  - Bug 2 trace: `SlotScorer.ts:83-84` calls `slot.start.getHours()` (returns UTC on server). `TimeSlotManager.ts` correctly uses `toZonedTime()` in `filterByWorkHours` but passes no timezone to `SlotScorer`. Fix = 4 lines across 2 files (pass `timeZone` to SlotScorer constructor, use `toZonedTime` in `scoreEnergyLevelMatch` and `scoreTimePreference`).
  - Health check: `npm audit` = 39 vulns (1 critical: form-data, 15 high). Not blocking Phase 1.
  - Unit tests: 8 test suites, all fail with **OOM** (`JavaScript heap out of memory`). Not code defects — Node needs `--max-old-space-size=4096` flag. Fix: add `NODE_OPTIONS=--max-old-space-size=4096` to test script in package.json (Phase 1 task).
- **Working:** Dev server localhost:3000, Postgres docker container, Prisma client, GCal manual sync
- **Broken:**
  - Bug 1: autoSync never fires (UI setting wired to nothing)
  - Bug 2: SlotScorer uses UTC hours → energy windows miss timezone offset
  - Unit tests: OOM on full suite run (configuration fix needed, not a code bug)
- **Next concrete task:** Phase 1.1 — reproduce Bug 2 first (easier to verify locally without GCal). Set work hours 09:00–15:00 in settings UI, create tasks, hit auto-schedule, confirm tasks land outside those hours.

---

## Important context for future-me

- **Two run modes:**
  - Dev (used now): `npm run db:up` + `npm run dev`. Hot-reload, edits live. DATABASE_URL=`@localhost:5432`.
  - Full Docker (per .env.example): `docker compose up -d`. Uses prebuilt upstream image, no live edits. DATABASE_URL=`@db:5432`.
- **Branch strategy:** `main` tracks upstream untouched. ALL FocusFlow work on `focusflow` branch.
- **Bug 1 root cause (confirmed):** `autoSync` UI checkbox exists in `IntegrationSettings.tsx` but no code reads `googleCalendarInterval` to fire a timer. `syncAllFeeds()` is defined in `src/store/calendar.ts` but never called automatically. Manual sync works. Fix = wire interval on settings save.
- **Bug 2 root cause (confirmed):** `SlotScorer.ts:83-84` uses `slot.start.getHours()` (UTC). `TimeSlotManager.ts` correctly uses `toZonedTime()` in `filterByWorkHours` but never passes `timeZone` to `SlotScorer`. 4-line fix across 2 files.
- **Unit tests OOM:** Run with `NODE_OPTIONS=--max-old-space-size=4096 npx jest --forceExit` to avoid heap crash.
- **Node mismatch:** `.nvmrc` says 20.14, system runs 22.17.1. Watch for Prisma binary errors; `nvm use` if seen.
- **SAAS dual-build:** repo is OSS+SaaS hybrid. `NEXT_PUBLIC_ENABLE_SAAS_FEATURES=false` keeps us OSS-only.
