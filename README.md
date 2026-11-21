# SAED web app — frontend (React + Vite)

The browser app for the NYSC SAED learning platform. It is a static single-page application that talks to the
**SAED API** (separate repository, `saed-backend`) over HTTPS.

| | |
|---|---|
| Version | **2.5.2** |
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
The browser needs the API's **full address** whenever the app and the API are on different hosts. If it were `/api`, requests would
go to the *web app's own host* (`https://app.example.com/api/...`), which has no API — the classic "works locally, not in production".

**One build, every environment.** The address is chosen automatically from the host name the app is opened on, using the table in
`public/config.js` (deployed next to `index.html`, editable on the server without rebuilding):

```js
window.__SAED_CONFIG__ = {
  API_URL: "",                                   // hard override - leave empty
  API_URLS: {
    "saed.dunistech.ng":      "https://saed-api.simplylovely.ng/api",   // production
    "*.staging.example.com":  "https://api.staging.example.com/api",    // wildcard for staging
    "localhost":              "/api",                                    // development (Vite proxy)
    "127.0.0.1":              "/api"
  }
};
```
Resolution order: `API_URL` → `API_URLS[host]` (exact, then `*.suffix`) → `VITE_API_URL` (build time: `.env.development` / `.env.production`) → `/api`.
A host-only value such as `https://api.example.com` gets `/api` appended. Add a new environment = add one line.

**Self-check:** if the API cannot be reached the app shows a red banner with the address it is using
(*"calling its own website"* = wrong address; *"cannot reach the SAED server"* = server down / CORS).

**Cookies:** sign-in is a cookie session set by the API. App and API should be on the **same site**; otherwise the backend needs
`CROSS_SITE_COOKIES=1` and some browsers still refuse (see `docs/DEPLOYMENT.md` §3).

**Media and letters** are always requested from the API host: partnership letters (`/api/users/<id>/partnership-letter/`), lesson
videos/documents (signed `/api/lessons/<id>/media/...` links) and profile pictures are resolved with `resolveMediaUrl()` in
`src/lib/config.js`, which prefixes API-relative paths with the API origin and leaves your own static files, `blob:` previews and
external (YouTube/Vimeo) links alone. Each file is rendered once, in-app, with no download links.

## Installable app (PWA)
The site can be installed on phones and desktops ("Install SAED" banner on Android/Chrome/Edge; Safari shows the
*Share → Add to Home Screen* hint). It needs **HTTPS** (or `localhost`).

* `public/manifest.webmanifest` — name, icons (192/512 + maskable), `standalone`, shortcuts (Dashboard, In-Camp sign-up).
* `public/sw.js` — service worker. **It never touches the API, media, admin, docs, `config.js` or any cross-origin request, so no private
  data is stored on the device.** It caches the hashed build files for fast reloads and shows `public/offline.html` when there is no network.
* Updates: a new release is announced with a "Refresh" bar; nothing reloads under the user mid-form.
* The service worker is registered only in production builds (in `npm run dev` any old one is removed).
* Changing the version string `VERSION` in `sw.js` is optional: build file names are hashed, so releases are picked up automatically.

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

## Static files (photos, icons)
Anything the site serves itself lives in `public/` and is copied into `build/`. The 63 camp-activity photos (`/activities/...`) must be placed in
`public/activities/` - they are not in this repository yet. `npm run check:assets` lists what is missing; the site shows placeholders meanwhile.
See `docs/STATIC-ASSETS.md`.

## 5. Tests, lint, build
```bash
npm run lint && npm test && npm run build
```
66 unit/component tests (Vitest + Testing Library): tracks and navigation, sign-up flows, camps admin, In-Camp filters, per-environment API address, media/letter URL resolution, single-viewer letters, service-worker rules and manifest checks.

## 6. Compatibility with the backend
| Frontend | Backend | |
|---|---|---|
| **2.5.x** (2.5.2 current) | **2.5.x** (2.5.1 current) | current |
| 2.5.x | 2.4.x | not compatible (no streams/tracks endpoints) |
| 2.4.x | 2.5.x | not compatible (sign-up contract changed) |

## 7. Troubleshooting
| Symptom | Cause / fix |
|---|---|
| Red banner "calling its own website" | no entry for this host name in `config.js` → add `"<host>": "https://<api>/api"` to `API_URLS` |
| Camp Activities photos missing | the photos are not in `public/activities/` (see `docs/STATIC-ASSETS.md`); never empty the web root before uploading |
| Letters or media do not open (works on localhost) | was calling the web host; fixed in 2.5.1 (media is resolved against the API origin) — check the API address as above |
| Old version / old `config.js` after deploy | the service worker and `.htaccess` send `no-cache` for `config.js`, `sw.js`, `index.html`; if a host overrides this, hard-refresh once |
| Browser console shows `POST https://<app-host>/api/auth/login/` | same cause — the request is going to the web host |
| "Your sign-in session could not be established" | API cookie not stored: wrong API address, or app and API on different sites (backend `docs/DEPLOYMENT.md` §2) |
| Refreshing `/login` or `/app/...` gives 404 | host lacks the SPA fallback: keep `.htaccess` (Apache) or add `try_files $uri /index.html` (nginx) |
| CORS error in the console | add the app origin to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` on the API |
| Old version after deploy | browsers cached `index.html`; keep `.htaccess` (sends `no-cache` for it and `config.js`) |
