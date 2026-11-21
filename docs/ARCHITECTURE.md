# Frontend architecture

```
src/
  main.jsx            routes + guards (ProtectedRoute: roles + track) + ApiStatusBanner
  lib/
    config.js         API address per host (config.js API_URL → API_URLS[host] → VITE_API_URL → /api), isCrossOriginApi, resolveMediaUrl
    pwa.js            service-worker registration, update + install events
    api.js            fetch wrapper: session cookie, CSRF token, JSON errors (err.data.fields), uploads, in-flight GET de-dup
    apiHealth.js      API reachability probe used by the banner
    auth.jsx          AuthProvider: user, login (verifies the session cookie really exists), logout, refreshUser
    track.js          trackOf(user), isInCamp(user), date/day helpers, STREAM_STATUS_LABEL
  hooks/useStreams.js open streams for sign-up and admin selectors
  components/{layout,ui}   AppShell (nav per role + track), FloatingNav, StreamBanner, ApiStatusBanner, InstallPrompt (install + update bar), viewers
  pages/
    public/           home, activities, opportunities, programs
    auth/             Login, SignupChooser, Signup (track prop), ForgotPassword (?email= prefill), VerifyEmail
    dashboard/        Dashboard (router), InCampDashboard, StreamExpired, AdminDashboard
    corper/           Courses (post-camp), InCampSaed, MyEnrollments, Trainers, CourseCard
    trainer/          MyCourses (+ In-Camp proposals), CourseEditor, CorpsMembers, Earnings
    admin/            Streams, StreamTrainers, Proposals, Reports, OrientationCamps, ManageUsers, DunisAdmin …
  styles/             tracks.css, forms.css (loaded last), corper.css …
public/               config.js (per-host API table), .htaccess, manifest.webmanifest, sw.js, offline.html, pwa-*.png, icons, logo
deploy/               nginx template + container entrypoint
```

## Two experiences, one app
`lib/track.js::trackOf(user)` returns `in_camp` or `post_camp` (admins: none). It drives:

* **Routes:** `ProtectedRoute roles=… track=…` — `/app/courses`, `/app/trainers`, `/app/earnings` are Post-Camp only; `/app/incamp` is In-Camp only. A wrong-track visit redirects to the dashboard.
* **Dashboard:** `Dashboard.jsx` renders `InCampDashboard` or the Post-Camp dashboard. Expired In-Camp accounts see `StreamExpired` instead of the portal (profile and notifications stay reachable).
* **Navigation:** `AppShell` builds the menu per role and track; admin menu sections: *In-Camp SAED / Post-Camp SAED / Platform*.
* **Sign-up:** `/signup` chooser → `/signup/in-camp` or `/signup/post-camp` (same `Signup` component, `track` prop, different steps/payload).
* **Expiry:** the "ended" page is driven by `user.lifecycle` / `user.inCampAccessActive` from `/auth/me/` (not by error codes). If an expired account still calls a protected endpoint the API answers `403` with `code: "stream_expired"` and the message is shown as an ordinary error.

## Route table (summary)
| Path | Who |
|---|---|
| `/`, `/activities`, `/opportunities`, `/programs` | public |
| `/login`, `/signup`, `/signup/in-camp`, `/signup/post-camp`, `/forgot`, `/verify-email` | public |
| `/app/dashboard`, `/app/profile`, `/app/notifications`, `/app/edit-profile` | any signed-in user |
| `/app/courses`, `/app/my-enrollments`, `/app/trainers` | Post-Camp corps members |
| `/app/incamp` | In-Camp corps members and In-Camp trainers |
| `/app/my-courses`, `/app/corps-members`, `/app/earnings` (Post-Camp only) | trainers |
| `/app/streams`, `/app/stream-trainers`, `/app/proposals`, `/app/reports`, `/app/camps`, `/app/users`, `/app/admin-courses` | SAED / Dunis admin |
| `/app/dunis-admin` | Dunis admin |

## Media and letters (one source of truth)
* Every file the API hands out is turned into a fetchable URL by `resolveMediaUrl()` (`lib/config.js`): `/api/...` and `/media/...` paths get the API origin when the API is on another host.
* **Partnership letters:** `DocumentViewer` fetches `/api/users/<id>/partnership-letter/` with the session cookie and renders it in-page (PDF → canvas, image → `<img>`). `LetterView` mounts **one** viewer; "Expand" enlarges that same instance (no second modal, no second download). `LetterField` (upload/replace) previews the current letter or the new selection in a single modal.
* **Lessons:** `LessonMedia` renders one video player and/or one document viewer per lesson; external YouTube/Vimeo links use their embeds; there are no download links.
* Superseded requests are aborted (`AbortController`), so a file is fetched once even when a component re-mounts.
* The service worker deliberately ignores all of these requests (never cached on the device).
