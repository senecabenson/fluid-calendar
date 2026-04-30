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

## Important context for future-me

- **Two run modes:**
  - Dev (used now): `npm run db:up` + `npm run dev`. Hot-reload, edits live. DATABASE_URL=`@localhost:5432`.
  - Full Docker (per .env.example): `docker compose up -d`. Uses prebuilt upstream image, no live edits. DATABASE_URL=`@db:5432`.
- **Branch strategy:** `main` tracks upstream untouched. ALL FocusFlow work on `focusflow` branch.
- **Today's date:** 2026-04-29. Bug 1 sync stops 2026-04-14 = **15-day gap** = strong hardcoded-window signal.
- **Node mismatch:** `.nvmrc` says 20.14, system runs 22.17.1. Watch for Prisma binary errors; `nvm use` if seen.
- **SAAS dual-build:** repo is OSS+SaaS hybrid. `NEXT_PUBLIC_ENABLE_SAAS_FEATURES=false` keeps us OSS-only.
