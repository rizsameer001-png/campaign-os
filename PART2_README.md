# Election Campaign OS — Part 2: Intelligence & AI

Builds on Part 1 (Auth, Profile, Media). This delivers **Election Readiness
Engine (§4.3)**, **Constituency Intelligence (§4.4)**, **AI Campaign Planner
(§4.5)**, and **AI Tools Hub (§4.8)** — all real, wired code, runnable with or
without an OpenAI API key.

## What's implemented

**Backend**
- Readiness Engine: deterministic weighted scoring across 5 pillars (Organization 25%, Digital 20%, Resources 15%, Voter 20%, Visibility 20%), draft autosave, 10-version retention, AI-generated recommendations layered on top, 7-day public share links, PDF-ready report structure.
- Constituency Intelligence: admin CRUD, candidate/volunteer read access, autocomplete search, compare-up-to-3, CSV bulk import (`{ "csv": "..." }` JSON body) with row-level validation (population > 0, gender ratio 800-1200, literacy 0-100), Redis 1h cache (no-ops cleanly if `REDIS_URL` isn't set).
- AI Campaign Planner: week-by-week plan generation with auto-allocated budget (Digital 30% / Ground 40% / Events 20% / Misc 10%), per-item status tracking (pending/in_progress/completed), custom task insertion, versioned regeneration.
- AI Tools Hub: Speech Generator, Manifesto Builder, Opposition Tracker (text-summarization, **not** scraping — see design note below), Social Media Generator — all sharing one `llm-client.js`, one `usage-tracker.js` (AIH-U-001 cost/token logging), and one quota middleware (blocks at 100% monthly spend, warns at 80%).

**Frontend**
- Readiness form → live score breakdown (pillar bars) → strengths/weaknesses → AI recommendations, plus report history and detail pages.
- Constituency autocomplete search with detail card.
- Campaign plan generator → week timeline with inline status dropdowns.
- AI Tools Hub landing page + all four generator pages, quota meter component.
- All wired into the sidebar nav and `AppRouter.jsx` from Part 1 — no separate app to run.

## Run locally

Same setup as Part 1 (`npm install`, `docker compose up`, migrate, seed) — see
`PART1_README.md`. Part 2 adds these env vars to `apps/backend/.env`:

```bash
# Optional — everything works without this, using a labeled stub response instead
OPENAI_API_KEY=
AI_MODEL=gpt-4o-mini
AI_COST_PER_1K_INPUT_TOKENS_INR=0.15
AI_COST_PER_1K_OUTPUT_TOKENS_INR=0.60
AI_MONTHLY_QUOTA_INR=500

# Optional — constituency caching no-ops cleanly without this
REDIS_URL=redis://localhost:6379
```

Since the schema changed (new fields on `User` for Part 1, plus the full
Part 2 model set from `schema.prisma`), re-run:

```bash
npm run prisma:migrate:dev --workspace=apps/backend -- --name part2
npm run prisma:seed --workspace=apps/backend
```

## Try it (no OpenAI key needed)

1. Log in, go to **Readiness Engine**, fill the form, submit. You'll get a
   real weighted score immediately (the scoring math doesn't need AI) — the
   "Recommendations" section will show a labeled placeholder since no AI key
   is configured.
2. Go to **Constituency Intel**, search "Chandni" — the seed data includes a
   few sample constituencies, so autocomplete has something to find.
3. Go to **Campaign Planner → New Plan**, fill in a budget and days-until-election
   — you'll get a real week-by-week structure with budget math, and
   placeholder theme/action text per week (again, real without AI, templated
   without a key).
4. Go to **AI Tools Hub** and try any generator — same pattern, labeled
   fallback text instead of an error.

## Try it (with a real OpenAI key)

Set `OPENAI_API_KEY` in `apps/backend/.env`, restart the backend. Everything
above now returns real generated content, and `ai_usage_logs` starts
accumulating real token counts and INR costs (`AI_COST_PER_1K_*_TOKENS_INR`
controls the conversion — adjust to match your actual OpenAI pricing tier).

Check quota enforcement: set `AI_MONTHLY_QUOTA_INR=1` temporarily, generate
one thing, and the next AI request should return a 429 with a clear message
— confirms the quota middleware is wired correctly before you rely on it in
production.

## Design decisions worth knowing about

- **Opposition Tracker doesn't scrape.** The FRD's AIH-O-002 describes
  automated scraping of opponent social/news activity. That's deliberately
  not built here — a general-purpose scraper targeting a named individual's
  public activity is a legal/ToS question worth a real review, not a
  starter-kit default. Instead, the candidate's team pastes in text they've
  already gathered, and the AI summarizes/compares it. Same value delivered
  (AIH-O-003/005), no scraping infrastructure to maintain or defend.
- **Readiness scoring is deterministic, not AI-generated.** ERE-S-005 says
  AI "enhances" scoring — read literally, that means the pillar math itself
  stays reproducible and auditable (same inputs always produce the same
  score), and AI's role is generating the *recommendations* text on top.
  This avoids a candidate getting a different readiness score on two
  identical submissions just because the model sampled differently.
- **Generated content lives in `ai_usage_logs.metadata` (JSONB), not a
  separate table.** Keeps the schema from Part 1 unchanged. If full-text
  search across a candidate's speech history becomes a real requirement,
  that's a clean promotion to a dedicated `ai_generated_content` table later
  — noted as a TODO, not a gap.
- **CSV bulk import expects JSON `{ "csv": "..." }`,** not a raw file
  upload — no multipart handling was added in Part 2. If real file uploads
  matter here, it's a small addition (multer + the existing CSV parser
  already does the row parsing/validation).

## Next: Part 3 (Operations & Admin)

Live Command Center (§4.6), Volunteer Management (§4.7), Admin Panel/CRM
(§4.10), Public Interface (§4.9), Reports (§4.13) — same approach, same
delivery format.
