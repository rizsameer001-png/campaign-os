# Election Campaign OS — Part 3: Operations & Admin

Completes the platform. Builds on Parts 1 (Auth/Profile/Media) and 2
(Readiness/Constituency/Campaign Planner/AI Tools). This delivers **Live
Command Center (§4.6)**, **Volunteer Management System (§4.7)**, **Admin
Panel/CRM (§4.10)**, **Public Interface (§4.9)**, and **Reports (§4.13)**.

## What's implemented

**Backend**
- **Volunteer Management**: invite (7-day single-use token, 500-cap check), signup, approve/reject, full CRUD. Tasks with templates, group assignment, overdue flagging. Booths with check-in, coverage map (Green/Yellow/Red), duplicate-submission detection (1h window). Attendance with 24h auto-lock. Rally reports (max 5 photos).
- **Live Command Center**: full snapshot endpoint, daily metric rollup/upsert, time-series with date filtering, admin-aggregate view, automatic threshold alerts (sentiment < -20 or booth coverage < 50%).
- **Admin Panel**: user management (list/filter/paginate/sort/bulk actions/approve/suspend/ban/soft-delete/impersonate/create-admin), dashboard stats + 30-day signup trend + AI-usage-by-tool breakdown, campaign monitoring with automatic flagging (zero volunteers / no activity in 7 days / low sentiment), settings as a flexible key-value store, audit log viewer, leads management with conversion tracking and source analytics, AI usage monitoring (per-request log, aggregate stats, per-candidate billing).
- **Public Interface**: services catalog, contact form and service inquiries (both create leads + notify admins), public candidate profiles (slug-gated, respects `profileVisibility`), public constituency listing.
- **Reports**: candidate overview report (readiness + plans + volunteers + booth coverage + AI usage + task breakdown in one call), volunteer engagement report with CSV export, admin platform overview.

**Frontend**
- Volunteer list (approve/reject), invite page, public signup page, task board with templates, booth coverage map, a combined "Field Actions" page for volunteers (attendance, check-in, rally report).
- Live Command Center dashboard with real-time-feeling KPI cards (30s polling) and threshold alert banner.
- A **separate Admin Shell** (dark sidebar, different from the candidate `DashboardShell`) with dashboard, user management, campaign monitoring, leads, AI usage, and audit log pages — gated by `ProtectedRoute allowedRoles={['admin', 'super_admin']}`.
- Public landing page, contact page, and candidate public profile page — all outside the authenticated shell, no login required.
- Sidebar nav is now **role-filtered**: candidates and volunteers share `DashboardShell`, but each only sees the nav items relevant to their role.

## Schema additions

Two additions since Part 2 (already synced into the delivered `schema.prisma`):
- `SystemSetting` model — a key/value store (`key`, `value: Json`) backing admin settings (AD-S), so new settings don't need a migration.
- `User.notificationPreferences` (Json) — backs NCS-006 email/SMS opt-out, defaulting to both-on if unset.

Run the migration before starting the backend:
```bash
npm run prisma:migrate:dev --workspace=apps/backend -- --name part3
npm run prisma:seed --workspace=apps/backend
```

## Try it end-to-end

1. **As a candidate**: log in, go to **Volunteers → Invite Volunteer**, enter an email. Since no SMTP is configured, the invite page shows you the signup link directly (dev convenience — remove that dev-note block once SMTP is wired up).
2. **Open that link in a new browser/incognito window**, complete the volunteer signup form.
3. **Back as the candidate**: the new volunteer shows up as "pending" on the Volunteers page — click Approve.
4. **Log in as the volunteer** (the account is `active` immediately, no OTP/admin-approval gate like candidates have — only the *volunteer profile* itself needs candidate approval). Try **Field Actions**: mark attendance, check in to a booth, submit a rally report.
5. **Back as the candidate**: check **Command Center** — booth coverage and volunteer counts should reflect what you just did. Check **Booth Coverage** page for the Green/Yellow/Red map.
6. **As an admin** (use the seeded `superadmin@election-os.local` account — see Part 1's `PART1_README.md` for the seed password env var): visit `/admin`, approve any pending candidates, check **Campaigns** for the flagged-campaigns view, check **AI Usage** for aggregate cost tracking.
7. **Public pages**: visit `/` (landing page, no login), `/contact` (creates a lead, notifies admins in-app), and `/candidate/:slug` once a candidate has set a public slug via their profile settings (Part 1) — note the public profile UI for *setting* the slug wasn't built as a dedicated page; it's a direct API call (`PUT /api/candidate/me/public-profile`) for now.

## Design decisions and known simplifications

- **Volunteer invitations are in-memory** (same pattern as Part 1's OTP store), not a DB table. Fine for a single-instance deployment; promote to a `volunteer_invitations` table if you need invitations to survive a server restart before being accepted, or if you scale to multiple backend instances without a shared store.
- **Sentiment score is a heuristic, not real NLP.** LCC-M-004 calls for AI-driven sentiment from social mentions and survey feedback — no social media API integration exists in this build, so `computeHeuristicSentiment()` derives a proxy from task completion rates instead of fabricating a fake "AI" number. Swap in a real pipeline once social API access exists; the function signature is already where that would plug in.
- **Booth coverage math treats "survey submissions" as booth report count** — there's no dedicated `Survey` model in the schema (LCC-D-002 describes shareable public survey forms, which wasn't built as its own module). If public surveys become a real requirement, that's a clean addition: a `Survey`/`SurveyResponse` model pair plus a couple of public routes mirroring the contact-form pattern already in `public.routes.js`.
- **Admin AI quota override** (`PUT /api/admin/ai-usage/quota`) writes to `system_settings` but `quota.middleware.js` still reads `AI_MONTHLY_QUOTA_INR` from the environment, not from that setting. Wiring the middleware to check `system_settings` first (falling back to the env var) is a small follow-up — flagged here rather than silently shipped as if it already works.
- **Admin approval emails, volunteer invite emails, etc. all go through the same `notifications.service.js` stub** from Part 1 — still logs instead of sending without real SMTP configured. Nothing new here, just confirming it scales to Part 3's new email types without changes.
- **Impersonation issues an access token only** (no refresh token) — intentional: an impersonation session shouldn't quietly persist past the access token's 15-minute lifetime.

## What's genuinely out of scope (Could Have / Phase 2 in the FRD)

- WhatsApp integration (VMS-A-006), push notifications (NCS-005), scheduled/emailed report generation (AD-R-003, RAS-005), map view for booth boundaries (CI-V-005/VMS-B, would need a mapping library), blog/CMS section (SPI-L-006). These were explicitly marked "Could Have" in the original FRD and weren't built — not oversights.

## The full platform, end to end

Parts 1–3 together now cover the entire FRD's Must Have and Should Have
scope. The monorepo structure, RBAC, Cloudinary media handling, and AI
provider abstraction were all designed in Part 1 specifically so that each
subsequent part slotted in without touching what came before — worth
checking `app.js` and `AppRouter.jsx` if you want to see how cleanly that
held up across all three deliveries.
