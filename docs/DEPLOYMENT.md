# Deploying the web app

The app is static files. Build once, upload, then set the API address in `config.js`.

## 0. Before you start — host names
Use host names on the **same site** for the app and the API, e.g. `https://saed.dunistech.ng` and `https://saed-api.dunistech.ng`
(see §3 for why). Create the API first (backend repo → `docs/DEPLOY-CPANEL.md`) and check that
`https://saed-api.dunistech.ng/api/health/` returns `{"status":"ok",...}`.

## 1. cPanel / Apache static hosting
1. Build (on your computer or CI):
   ```bash
   npm ci
   VITE_API_URL=https://saed-api.dunistech.ng/api npm run build      # Windows PowerShell: $env:VITE_API_URL="..." ; npm run build
   ```
   (Setting `VITE_API_URL` is optional if you edit `config.js` in step 3, but doing both is harmless.)
2. In cPanel → **File Manager** → the web root of `saed.dunistech.ng` (usually `public_html` or the sub-domain's folder):
   upload the **contents** of `build/` — `index.html`, `assets/`, `config.js`, `.htaccess`, icons. Show hidden files so `.htaccess` is not missed.
3. Open `config.js` in the web root and make sure this site's host name has an API address (no rebuild needed, effective immediately):
   ```js
   window.__SAED_CONFIG__ = { API_URL: "", API_URLS: {
     "saed.dunistech.ng": "https://saed-api.simplylovely.ng/api",   // production
     "localhost": "/api", "127.0.0.1": "/api"                        // development
   } };
   ```
   The right API is picked from the host the page is opened on, so the same files work for local, staging and production
   (add a line per environment; `"*.staging.example.com"` wildcards are supported).
4. Visit the site. A red banner at the top means the address is wrong or the API is down (the banner shows the address it uses).
5. Test: open `https://saed.dunistech.ng/login` (a direct deep link must load — that is the `.htaccess` SPA fallback), sign in, open the browser's
   **Network** tab: requests must go to `saed-api.dunistech.ng/api/...`, **not** to `saed.dunistech.ng/api/...`.

Upgrading: upload the new `build/` contents over the old ones but **keep your edited `config.js`** (or re-apply it).

## 2. Docker / nginx
```bash
# A) same origin: nginx serves the app and proxies /api to the API
API_UPSTREAM=https://saed-api.example.com docker compose up --build
# B) direct calls: the browser talks to the API itself (CORS must allow this origin)
API_URL=https://saed-api.example.com/api docker compose up --build
```
* `API_UPSTREAM` — where nginx forwards `/api`, `/admin`, `/docs`, `/static` (default `http://backend:8002`); resolved at request time, so nginx starts even if the API is down.
* `API_URL` — written to `/config.js` when the container starts (no rebuild).
* Build argument `VITE_API_URL` bakes an address into the bundle (default `/api`).
* TLS: terminate HTTPS in front of the container (load balancer / Caddy / host nginx).
* Plain nginx (no Docker): copy `deploy/default.conf.template`, replace `${API_UPSTREAM}` / `${DNS_RESOLVER}`, serve `build/`.
*(The container files could not be executed in the build sandbox — smoke-test once in your environment.)*

## 3. Same site, same origin or cross-site?
Sign-in is a cookie set by the API. Choose:

| Layout | Works? | Settings |
|---|---|---|
| **Same site**, different sub-domains (`saed.` + `saed-api.example.com`) | ✅ recommended | API: `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` = app origin. App: `config.js` with absolute API URL |
| **Same origin** (nginx proxies `/api`) | ✅ simplest for cookies | App: leave `API_URL` empty |
| **Different sites** (`app.a.com` + `api.b.org`) | ⚠️ some browsers block third-party cookies | API: `CROSS_SITE_COOKIES=1` (HTTPS). App: absolute API URL |

## 4. Go-live checklist
- [ ] `https://<api>/api/health/` is OK and `https://<api>/` shows the JSON status page
- [ ] `config.js` contains the API address; no red banner on the home page
- [ ] Network tab shows API calls going to the API host
- [ ] Sign-up, e-mail verification, sign-in, sign-out work; refresh on `/app/dashboard` keeps you signed in
- [ ] Deep links (`/login`, `/signup/in-camp`) load directly
- [ ] In-Camp sign-up lists the open streams (create one first as SAED admin: *Streams*)
- [ ] Documents/videos open inside a course and the partnership letter opens in the profile (media is streamed from the API host)
- [ ] PWA: on HTTPS, Chrome/Edge offers "Install"; DevTools → Application → Manifest shows no errors; with the network off, a reload shows "You're offline"
- [ ] Upload `manifest.webmanifest`, `sw.js`, `offline.html` and the `pwa-*.png` icons (they are part of `build/`); `sw.js` must be served from the site root
