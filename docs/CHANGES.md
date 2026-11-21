# Changed / added / removed

## Removed
* **Modules** (model, API, UI) — lessons now belong directly to a course.
* **Course-level price** and any "pay for the whole course" flow.
* **Fast Track** (videos, payments, pages, dashboard stats).
* **Content-locking subscription / feature payments** and the trainer "settings" for it (history kept as `legacy_feature` payments).
* **"Free Preview" checkbox** — a lesson is free unless it is locked with a price.
* **Orientation Camp management UI** from Dunis Admin (camps still exist and drive In-Camp access; backend endpoints kept).
* Separate payment-callback pages per product (one `/app/payment/callback` now).
* Insecure SSL-verification bypass in the old Paystack client; debug CSRF endpoints; stale `.bak`/`_0` files.
* Bank/subaccount fields from the generic profile-update API (they bypassed verification).

## Added
* **Unified `Payment` ledger** (trainer activation, video upload fee, lesson access, legacy) with statuses pending/success/failed/abandoned/mismatch/refunded.
* **Paystack**: server-side verification, `requested_amount` comparison, signed + idempotent webhook, subaccounts, split payments, bank list + account-name resolution.
* **Premium lessons**: pay with Paystack or bank transfer; trainer confirms/grants/revokes; Dunis access-activity report.
* **Video upload fee** (default ₦2,000, once per lesson; Dunis Admin can change or disable).
* **Private file storage** + signed, expiring, entitlement-checked streaming (Range support); in-app video/PDF/text viewers.
* **UUID course URLs** (legacy integer ids still resolve).
* **Catalogue** with filters (text, skill, type, state, LGA, trainer), newest first, paginated; **In-Camp SAED** section; **My Enrollments** with progress.
* **Trainer discovery** with no default filters; optional name/skill/state/LGA/PPA/location filters.
* **Trainer Earnings** page (summary, payments, payout bank account).
* **Dunis "Payments & Fees"**: fee settings, payments monitor, mismatch review (approve/reject), trainer activation re-verify, lesson access activity.
* **Notifications with direct links** (in-app and email) — API now returns `link`.
* Role-specific, consolidated sidebars exactly as specified; legacy URLs redirect.

## Fixed
* **"Paid: 2548224, Expected: 2500000"** — Paystack's `amount` includes processing fees when the customer bears them. The server now verifies against the amount *we requested* (strict, no tolerance), alongside currency/reference/customer. Real differences become a `mismatch` flagged to Dunis Admin; a genuine success is never shown as failed, and the user is told "under review — you haven't lost your money".
* Video-fee bypasses (generic image upload, document-link slot, link schemes), free-lesson grants by admins, admin write access to other trainers' lessons, legacy-path file reads, race conditions on payment initialisation (found in independent review).

## Roles at a glance
| Role | Sidebar |
|---|---|
| Corps member | Dashboard, Courses, In-Camp SAED, My Enrollments, Trainers, Profile, Notifications |
| Trainer | Dashboard, My Courses, In-Camp Sessions, Corps Members, Earnings, Profile, Notifications |
| SAED Admin | Dashboard, Users, Courses, Enrollments, Profile, Notifications |
| Dunis Admin | SAED Admin items + Payments & Fees |

Dunis Admin has final authority on fees and disputed payments; SAED Admin keeps its existing roles (read-only on fees).


## v2.1.0 — tooling, production hardening and API docs
* **Frontend**: CRA/`react-scripts` removed → Vite 8, React 19, react-router 7, vitest, ESLint 10. `npm run dev` and `npm start` both work (also on Windows); `npm install` shows no deprecation warnings and `npm audit` reports 0 vulnerabilities. Env vars are `VITE_API_URL` / `VITE_BACKEND_URL`. `src/setupProxy.js` replaced by the Vite proxy.
* **Database**: `DATABASE_URL` (SQLite or PostgreSQL) via dj-database-url + psycopg 3; SQLite uses IMMEDIATE transactions. Full suite and legacy-data migration verified on both.
* **Settings**: environment-driven and secure by default (no insecure fallbacks, required secret/hosts, HTTPS/HSTS/secure cookies, password validators, whitenoise, structured logging, optional Redis cache).
* **Auth hardening**: throttling on login/signup/reset/verification endpoints; `/api/health/ready/` readiness probe.
* **API documentation**: OpenAPI 3.1 generated from the URLconf, Swagger UI `/api/docs/` (`/docs/`), ReDoc `/api/redoc/`, `/api/openapi.json`, `docs/API.md`, `manage.py export_openapi`; access via `API_DOCS=public|staff|off`.
* **Ops**: Dockerfiles, docker-compose (Postgres + Redis + gunicorn + nginx), nginx config, GitHub Actions CI (SQLite + PostgreSQL matrix).
* Tests: 114 backend (7 new API-doc tests), 9 frontend.


## v2.2.0 — in-app documents, letters, In-Camp consistency, branding, forms
* **Fix – admin "127.0.0.1 is blocked (ERR_BLOCKED_BY_RESPONSE)"**: the global `X-Frame-Options: DENY` blocked the letter in the admin's frame. Letters now stream through an authenticated endpoint that is frame-allowed only for the app origin.
* **Fix – trainer "Page not found … /media/partnership_letters/…"**: letters were public `/media/` URLs. They are now private, served via `/api/users/<id>/partnership-letter/`, with a clear "file missing – upload again" state when the file is not on disk. Migration `0005` + `move_partnership_letters` command.
* **Everything opens in-app**: new pdf.js-based `DocumentViewer`; no download/new-tab/print actions; Microsoft Office-online embed removed; lesson documents limited to PDF/TXT/images; external document links rejected; stream never serves `attachment`.
* **Letters**: upload, replace (old file deleted), preview before saving, inline admin review; the signup form now actually validates the letter.
* **In-Camp**: trainers get the same In-Camp SAED page as corps members (own courses); redundant "In-Camp Sessions" page and API removed.
* **Logo** in sidebar, public nav and all auth pages (`BrandLogo`, `VITE_LOGO_URL`, bundled fallback).
* **Forms/controls**: one consistent, responsive style system; fixed the dark-sidebar Logout contrast and the 5-column users table.
* Frontend now requires Node ≥ 22.13 (pdfjs-dist 6.5.438 – the first release without the 2026 arbitrary-JS-execution advisory).


## v2.5.1 — Environment-aware API address, installable app, media/letter fixes  *(frontend)*
* **API address per environment:** `public/config.js` now maps host names to APIs (`API_URLS`, exact and `*.suffix` wildcards) so one build works for local, staging and production; `API_URL` remains as a hard override.
* **PWA:** web manifest, icons (192/512/maskable), service worker (hashed assets cached; API, media, admin and cross-origin requests never cached), offline page, install banner (Android/Chrome/Edge + iOS hint), "new version — Refresh" bar, Apache/nginx cache headers. Verified in Chromium: zero installability errors.
* **Letters fixed on separate hosts:** partnership letters are API-relative paths and were being fetched from the web host; all API-provided media/image URLs now resolve against the API origin (`resolveMediaUrl`).
* **No duplicate rendering:** `LetterView` "Expand" enlarges the same viewer instead of mounting a second one (the letter was downloaded twice); superseded fetches are aborted; filler text under document viewers removed.
* Tests: 58.

## v2.5.0 — Streams, two separate experiences, production fixes  *(frontend)*
**Features**
* **In-Camp vs Post-Camp:** separate sign-ups (`/signup` chooser, `/signup/in-camp`, `/signup/post-camp`), dashboards, navigation and route guards (`track`). In-Camp sign-up has **no LGA/PPA**; it picks an open stream (+ optional camp) and skills.
* Public nav "Explore" → **In-Camp** (links to In-Camp sign-up); home hero button → "In-Camp SAED".
* In-Camp dashboard with stream window and days left; expired accounts get an "access ended" page; stream banner across the portal.
* Admin: **Streams**, **In-Camp Trainers** (create, correct, re-activate, deactivate, re-invite, delete), **Proposals** (approve/decline with note), **Reports** (per stream/year + CSV), stream selector on Camps, users filter by stream and programme; admin menu grouped by programme.
* Trainers: propose In-Camp courses for their stream; approval badges and banners; resubmit after decline.
* Forgot-password page pre-fills the e-mail from invite links (`/forgot?email=`).

**Production fixes**
* **API address is now configurable at runtime** (`config.js`) as well as at build time (`VITE_API_URL`); a host-only address gets `/api` appended. Fixes requests being sent to the web host (`https://app/api/...`) when deployed on a different host than the API.
* **API reachability banner** (explains "calling its own website" vs "cannot reach the server" and shows the address in use).
* Clearer sign-in message when the browser blocks the API's cookie (cross-site setups).
* `.htaccess` (SPA fallback + cache headers) for cPanel/Apache; nginx image reads `API_UPSTREAM`/`API_URL` at start and no longer fails to boot when the API is unreachable.
* Docs: README, `DEPLOYMENT.md`, `ARCHITECTURE.md`, `BACKEND-CONTRACT.md`. Tests: 40.

## v2.4.0 — In-Camp skill sets
* In-Camp SAED: new **Skill set** filter; corps members land on their own skill set first (matches ranked first across pages, badge on cards). Empty skill sets show "nothing listed currently" instead of a blank page, and corps members whose skill set has no courses can optionally explore all other courses. Same filter for trainers (no re-ordering). 7 new backend and 3 new frontend tests.

## v2.3.0 — fixes, performance, camps, branding
* **Fix – 500 on opening some courses** (`ImportError: session_payload`): leftover import from the removed training-sessions feature in the course detail view. Removed; regression test covers In-Camp course detail for every role.
* **Performance** (see README §5b): N+1 queries removed from trainers, dashboard, my-courses, In-Camp; correlated sub-select counts replace multi-join aggregates; indexes; JSON gzip; request de-duplication.
* **Frontend toolchain**: jsdom 27.4 – installs without `EBADENGINE` warnings on Node 22.13+ (engine ranges of every package verified against 22.13, 22.x and 24), 0 deprecated packages, 0 vulnerabilities.
* **Logo & favicon**: official NYSC emblem (transparent background) in sidebar, public nav and auth pages; full favicon set. Auth-page logos link to home.
* **Admin SAED Camps page** with add/edit/activate/delete and usage counts; camp API hardened (validation, duplicate and in-use protection).
