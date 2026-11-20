# Testing the web app

```bash
npm run lint && npm test && npm run build
```
40 tests (Vitest + Testing Library, jsdom): `tracks` (chooser, per-track sign-up, nav, expired page), `camps`, In-Camp filters,
`config` (API-address resolution, cross-origin detection, API health detection), plus the earlier suites.

## Manual smoke test against a real API
1. `config.js` → your API address; load the site: no red banner.
2. Network tab: calls go to the API host. Sign in as SAED admin → *Streams* → create a stream → *Camps* → add a camp in it → *In-Camp Trainers* → create a trainer.
3. Sign up as an In-Camp corps member (`/signup/in-camp`): stream list is shown, no LGA/PPA; after sign-in the dashboard shows the stream window.
4. As the In-Camp trainer: *My Courses → Propose a course*; as admin: *Proposals → Approve*; the corps member sees it under *In-Camp SAED*.
5. Set the stream's end date in the past (admin → Streams) → the corps member sees "access ended"; Post-Camp accounts are unaffected.
6. Refresh on `/app/dashboard` and open `/login` directly: both load (SPA fallback).
