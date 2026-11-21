# Testing the web app

```bash
npm run lint && npm test && npm run build
```
66 tests (Vitest + Testing Library, jsdom): `tracks` (chooser, per-track sign-up, nav, expired page), `camps`, In-Camp filters,
`config` (per-host API table, wildcards, cross-origin detection, health detection, media/letter URL resolution), `viewer` (letters rendered once), `pwa` (service-worker rules, manifest and icon files), plus the earlier suites.

## Manual smoke test against a real API
1. `config.js` → your API address; load the site: no red banner.
2. Network tab: calls go to the API host. Sign in as SAED admin → *Streams* → create a stream → *Camps* → add a camp in it → *In-Camp Trainers* → create a trainer.
3. Sign up as an In-Camp corps member (`/signup/in-camp`): stream list is shown, no LGA/PPA; after sign-in the dashboard shows the stream window.
4. As the In-Camp trainer: *My Courses → Propose a course*; as admin: *Proposals → Approve*; the corps member sees it under *In-Camp SAED*.
5. Set the stream's end date in the past (admin → Streams) → the corps member sees "access ended"; Post-Camp accounts are unaffected.
6. Refresh on `/app/dashboard` and open `/login` directly: both load (SPA fallback).

## PWA smoke test (HTTPS or localhost, production build)
1. DevTools → Application → *Manifest*: no errors, icons shown; *Service workers*: `sw.js` activated.
2. Chrome/Edge address bar shows the install icon; install, open as an app; sign in works.
3. DevTools → Network → Offline, reload: "You're offline" page. Application → *Cache storage*: no `/api/` entries.
4. Deploy a new build: the "A new version of SAED is available — Refresh" bar appears; Refresh loads it.
