# Election Campaign OS — Part 1: Foundation & Identity

This delivers a fully wired, runnable slice of the platform: **Auth (§4.1)**,
**Candidate Profile (§4.2.2)**, **Media/Cloudinary uploads (MED-*)**, RBAC
middleware, and a notifications stub. Parts 2 (Intelligence & AI) and 3
(Operations & Admin) build on top of this without touching what's here.

## What's implemented

**Backend**
- Candidate registration → phone OTP verification → pending-admin-approval flow
- Candidate login + Admin login (2FA/TOTP) with RS256 JWT access + refresh tokens
- Refresh-token rotation, session listing/revocation, account lockout after 5 failed attempts
- Forgot/reset password with 1-hour token expiry, forces re-login everywhere on change
- RBAC middleware (`authenticate`, `authorize`, `authorizeOwnerOrAdmin`)
- Role-aware rate limiting, security headers, centralized error handling
- Candidate profile update/email-change/password-change/public-profile/account-deletion
- Cloudinary signed direct-upload endpoint (frontend never sends files through Node)
- Minimal notifications (in-app + stubbed email) — full SMS/queue infra lands in Part 3

**Frontend**
- Register → Verify OTP → Login flow, Forgot/Reset password
- Axios client with automatic access-token refresh on 401
- Zustand auth store (access token kept in memory only, never localStorage)
- Protected routes with role checks, dashboard shell with sidebar/logout
- Profile settings page wired to the real API

## Run locally

```bash
# 1. Install dependencies (workspace root)
npm install

# 2. Start local Postgres 18 + Redis
docker compose -f infra/docker/docker-compose.yml up -d

# 3. Configure backend env
cp apps/backend/.env.example apps/backend/.env
# Fill in DATABASE_URL/DIRECT_URL (point at the local docker-compose postgres,
# or your Neon/Supabase instance), and generate JWT keys:
openssl genrsa -out /tmp/private.pem 2048
openssl rsa -in /tmp/private.pem -pubout -out /tmp/public.pem
# base64-encode both and paste into JWT_PRIVATE_KEY_BASE64 / JWT_PUBLIC_KEY_BASE64:
base64 -w0 /tmp/private.pem   # -> JWT_PRIVATE_KEY_BASE64
base64 -w0 /tmp/public.pem    # -> JWT_PUBLIC_KEY_BASE64

# 4. Run migrations + seed
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Start both apps
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173 (proxies /api to :5000)
```

## Try it

1. Visit `http://localhost:5173/register`, fill the form (any values pass validation
   except the password rules — 8+ chars, upper, lower, number, special char).
2. Since no SMS gateway is configured, the OTP is **logged to the backend console**
   (`logger.warn('SMS gateway not configured...')`) — copy it into the verify page.
3. After verification, the account is `PENDING_APPROVAL` — there's no admin UI yet
   (that's Part 3), so approve it directly in the DB for now:
   ```sql
   UPDATE users SET status = 'active' WHERE email = 'you@example.com';
   ```
4. Log in, land on `/dashboard`, edit your profile at `/profile`.

## What's intentionally stubbed here (not missing — sequenced into later parts)

- **SMS/email delivery**: logs instead of sending until a real gateway/SMTP client is wired in (Part 3's `notifications` module).
- **Admin approval UI**: Part 3 (§4.10 Admin Panel).
- **reCAPTCHA verification**: the register form sends a placeholder token; real
  verification against Google's API is a one-file addition to `auth.validation.js`
  once you have a site key.
- **Password-reset tokens as their own table**: currently columns on `User`
  (`passwordResetTokenHash`, `passwordResetExpiresAt`) for simplicity — fine at
  this scale, call out if you want it normalized into its own table later.

## Next: Part 2 (Intelligence & AI)

Election Readiness Engine (§4.3), Constituency Intelligence (§4.4), AI Campaign
Planner (§4.5), AI Tools Hub (§4.8) — say the word and it's built the same way:
real, runnable modules slotting into `app.js`'s marked route slots and
`AppRouter.jsx`'s marked route slots.
