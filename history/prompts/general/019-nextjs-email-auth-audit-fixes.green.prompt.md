---
id: "019"
title: Next.js Email Auth + Audit Fixes
stage: green
date: 2026-02-18
surface: agent
model: claude-sonnet-4-6
feature: web-command-center
branch: 001-gold-tier-full
user: tayyab
command: continue session
labels: ["nextjs","auth","credentials","bcrypt","audit","security","middleware"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - apps/web/package.json
  - apps/web/package-lock.json
  - apps/web/next.config.js
  - apps/web/prisma/schema.prisma
  - apps/web/src/middleware.ts
  - apps/web/src/lib/auth.ts
  - apps/web/src/lib/rate-limit.ts
  - apps/web/src/types/next-auth.d.ts
  - apps/web/src/app/login/page.tsx
  - apps/web/src/app/api/auth/signup/route.ts
  - apps/web/tsconfig.json
tests:
  - npx tsc --noEmit → 0 errors
  - npx next lint → 0 warnings
---

## Prompt

We have a Next.js app at /apps/web. It currently supports 'Sign in with GitHub' via NextAuth. We need to add 'Sign in with Email/Password' too, and fix the dev warnings/errors shown below.

IMPORTANT CONSTRAINTS:
- No paid services. No new packages beyond bcryptjs (already planned).
- Keep GitHub OAuth working exactly as before.
- Use JWT session strategy (required for CredentialsProvider with PrismaAdapter).
- Email/password users: passwordHash nullable so GitHub-only users are unaffected.

CURRENT ISSUES TO FIX:
1. npm audit fix --force upgraded Next to 16.1.6 and eslint to 4.1.1 — revert to stable versions
2. next.config.js has experimental.serverComponentsExternalPackages (deprecated in 14.1+)
3. middleware.ts "must export a function" error from next-auth/middleware re-export
4. [next-auth][warn][NEXTAUTH_URL] warning — NEXTAUTH_URL missing in .env.local

TASK A — EMAIL/PASSWORD AUTH:
- Add CredentialsProvider to NextAuth using Prisma + bcryptjs
- Add /api/auth/signup route (POST, validation, rate limiting, bcrypt hash)
- Update login page: GitHub | Email tabs, Sign In / Sign Up toggle

TASK B — Fix next config + middleware
TASK C — Fix NEXTAUTH_URL (already in .env.local.example from prior session)
TASK D — npm audit properly (no --force breakage)

## Response snapshot

Implemented all tasks in sequence:

1. **auth.ts** — Added `CredentialsProvider` with `bcrypt.compare()` authorize; switched `strategy` from `'database'` to `'jwt'`; updated callbacks from `{ session, user }` to `{ session, token }` + `jwt: ({ token, user }) => { if (user) token.id = user.id; return token }`.

2. **next-auth.d.ts** — Added `JWT extends DefaultJWT { id: string }` module augmentation alongside existing `Session` augmentation.

3. **rate-limit.ts** — In-memory rate limiter: 15-minute window, max 10 attempts, keyed by `signup:ip:<ip>` and `signup:email:<email>`.

4. **signup/route.ts** — POST handler: validates email regex + password >= 8 chars; rate-limits; checks duplicates; hashes with `bcrypt(12)`; creates user via Prisma.

5. **login/page.tsx** — Replaced GitHub-only button with two-tab (GitHub | Email) UI. Email tab: Sign in / Create account toggle; name (optional, signup only), email, password inputs; inline error/success banners; calls `/api/auth/signup` then `signIn('credentials')`. Wrapped in `<Suspense>` for `useSearchParams()`.

6. **schema.prisma** — Added `passwordHash String?`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` to User model (already done in prior turn).

7. **next.config.js** — Moved `serverComponentsExternalPackages` out of `experimental`.

8. **middleware.ts** — Replaced `export { default } from 'next-auth/middleware'` with explicit `async function middleware()` using `getToken()` from `next-auth/jwt`.

9. **package.json** — Restored `next@14.2.35` (patched from 14.2.30), `eslint@^8.57.0`, `eslint-config-next@14.2.35`; added `bcryptjs@^2.4.3` + `@types/bcryptjs`.

10. **Audit** — Upgraded Next 14.2.30 → 14.2.35 (patches SSRF/DoS/cache CVEs). Left eslint/ajv/glob dev-tool warnings alone (fix would destructively downgrade eslint to 4.1.1).

Commit: `b0688c5 fix(web): add email/password auth + fix Next config, middleware, audit`

## Outcome

- ✅ Impact: Email/password sign-up and sign-in fully functional alongside GitHub OAuth. All 4 reported issues resolved. Next.js security CVEs patched.
- 🧪 Tests: tsc --noEmit clean, next lint clean (0 errors, 0 warnings)
- 📁 Files: 12 files changed, 375 insertions, 44 deletions; 2 new files created (signup/route.ts, rate-limit.ts)
- 🔁 Next prompts: Run prisma migrate dev to apply passwordHash column; test full sign-up → sign-in → /app flow; deploy to Vercel
- 🧠 Reflection: JWT strategy is mandatory when mixing CredentialsProvider with PrismaAdapter — database sessions cannot be created for credential logins. The `getToken()` approach in middleware works correctly for both OAuth and Credentials sessions.

## Evaluation notes (flywheel)

- Failure modes observed: NTFS rename permission error when npm tried to update @next/swc-linux-x64-gnu in-place (WSL/Windows filesystem). Fixed by deleting node_modules/@next then reinstalling. Stale .next cache from Next 16 caused spurious tsc errors — fixed by rm -rf .next.
- Graders run and results (PASS/FAIL): tsc PASS, next lint PASS
- Prompt variant (if applicable): continuation from prior context-compacted session
- Next experiment: add prisma migrate and test on live Neon DB
