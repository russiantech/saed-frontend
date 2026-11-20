# SAED web app — frontend (React + Vite)

The browser app for the NYSC SAED learning platform. It is a static single-page application that talks to the
**SAED API** (separate repository, `saed-backend`) over HTTPS.

| | |
|---|---|
| Version | **2.5.0** |
| Stack | React 19 · Vite 8 · React Router 7 · Vitest · pdf.js (in-app PDF viewing) |
| Node | **22.13+** (pdf.js requires it) |
| Needs | `saed-backend` ≥ 2.5.0 (see compatibility) |

## Contents
1. [Quick start](#1-quick-start) · 2. [Pointing the app at the API](#2-pointing-the-app-at-the-api-important)
3. [Deploying](#3-deploying) · 4. [What the app contains](#4-what-the-app-contains)
5. [Tests, lint, build](#5-tests-lint-build) · 6. [Compatibility](#6-compatibility-with-the-backend) · 7. [Troubleshooting](#7-troubleshooting)

## 1. Quick start
```bash
npm install
cp .env.example .env          # VITE_API_URL=/api  and  VITE_BACKEND_URL=http://127.0.0.1:8002
npm run dev                   # http://localhost:3002   (/api and /media are proxied to the backend on :8002)
```
Start the API from the backend repo first (`python manage.py runserver 127.0.0.1:8002`).

## 2. Pointing the app at the API (important)
The browser needs the API's **full address** whenever the app and the API are on different hosts. If it is left as the
default `/api`, requests go to the *web app's own host* (`https://app.example.com/api/...`) which has no API — the typical
"works locally, not in production" failure (sign-in appears to succeed but no session is created).

The address is resolved in this order:

1. **`config.js`** next to `index.html` — `window.__SAED_CONFIG__ = { API_URL: "https://saed-api.example.com/api" }`.
   Editable **after** the build, no rebuild needed. This is the recommended way on cPanel/static hosting.
2. **`VITE_API_URL`** at build time (`.env.production` or CI variable).
3. **`/api`** — same origin (dev server, or nginx proxying `/api` to the backend).

`https://saed-api.example.com` (host only) is accepted and `/api` is appended.

**Self-check:** if the API cannot be reached the app shows a red banner at the top —
*"The app is calling its own website instead of the SAED server…"* (address misconfigured) or
*"The app cannot reach the SAED server right now"* (server down / blocked by CORS) — together with the address it is using.

**Cookies:** sign-in is a cookie session set by the API. The app and API should be on the **same site**
(`saed.example.com` + `saed-api.example.com`). On unrelated domains browsers may drop the cookie; the backend then needs
`CROSS_SITE_COOKIES=1` and some browsers still refuse. See `docs/DEPLOYMENT.md` §3.

## 3. Deploying
| Target | Guide |
|---|---|
| **cPanel / any static host (Apache)** | `docs/DEPLOYMENT.md` §1 — upload the contents of `build/`, edit `config.js` |
| Docker / nginx | `docs/DEPLOYMENT.md` §2 — `docker compose up --build` (image reads `API_URL` / `API_UPSTREAM` at start) |

```bash
npm ci && npm run build        # output: build/   (index.html, assets/, config.js, .htaccess, icons)
```
Deploy order for upgrades: backend first (`migrate`), then this app.

## 4. What the app contains
Two clearly separated experiences share one codebase (details in `docs/ARCHITECTURE.md`):

* **In-Camp SAED** — own sign-up (`/signup/in-camp`: stream, camp, skills; **no LGA/PPA**), own dashboard with the stream window and days left, own course catalogue (skill-set filter, own-skills-first), course proposals for trainers, and an "access ended" page once the stream is over.
* **Post-Camp SAED** — own sign-up (`/signup/post-camp`), courses, trainers discovery, earnings; unchanged behaviour.
* **Admin** — sidebar grouped *In-Camp SAED / Post-Camp SAED / Platform*: Streams, In-Camp Trainers (CRUD, re-activate, invite), Proposals (approve/decline), Reports (per stream, CSV), Camps, Users (filter by stream/programme), Courses, Dunis payments & fees.
* The public home page's second call-to-action is **In-Camp SAED** and goes to the In-Camp sign-up.
* Documents and letters are rendered **inside** the app (no downloads); video is streamed from the API.

## 5. Tests, lint, build
```bash
npm run lint && npm test && npm run build
```
40 unit/component tests (Vitest + Testing Library): tracks and navigation, sign-up flows, camps admin, In-Camp filters, API-address resolution and health detection.

## 6. Compatibility with the backend
| Frontend | Backend | |
|---|---|---|
| **2.5.x** | **2.5.x** | current |
| 2.5.x | 2.4.x | not compatible (no streams/tracks endpoints) |
| 2.4.x | 2.5.x | not compatible (sign-up contract changed) |

## 7. Troubleshooting
| Symptom | Cause / fix |
|---|---|
| Red banner "calling its own website" | `API_URL` empty or wrong → set it in `config.js` (or rebuild with `VITE_API_URL`) |
| Browser console shows `POST https://<app-host>/api/auth/login/` | same cause — the request is going to the web host |
| "Your sign-in session could not be established" | API cookie not stored: wrong API address, or app and API on different sites (backend `docs/DEPLOYMENT.md` §2) |
| Refreshing `/login` or `/app/...` gives 404 | host lacks the SPA fallback: keep `.htaccess` (Apache) or add `try_files $uri /index.html` (nginx) |
| CORS error in the console | add the app origin to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` on the API |
| Old version after deploy | browsers cached `index.html`; keep `.htaccess` (sends `no-cache` for it and `config.js`) |
