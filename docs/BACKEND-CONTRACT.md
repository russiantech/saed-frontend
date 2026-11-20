# How the app uses the API (summary)
Full reference: the backend repo's `docs/API.md` / `/api/docs/`. This page lists what the frontend relies on.

* **Base address:** `API_BASE_URL` (see README §2). Every call is `fetch(`${API_BASE_URL}${path}`, { credentials: "include" })`.
* **Session + CSRF:** sign in with `POST /auth/login/`; the API sets `sessionid` (HttpOnly) and `csrftoken`. The app fetches `GET /csrf/`
  and sends `X-CSRFToken` on every non-GET request. After login the app calls `GET /auth/me/`; if that returns no user the cookie was
  not stored and the "session could not be established" message is shown.
* **Errors:** non-2xx responses are JSON `{ "error" | "detail" | "message": "...", "fields"?: {...}, "code"?: "..." }`; the client throws `Error(message)` with `err.status` and `err.data` (`err.data.fields` for field errors).
  `403` + `code: "stream_expired"` → In-Camp stream ended (the UI relies on `user.lifecycle` for the "ended" page; the message is displayed if such a call is made anyway). A non-JSON (HTML) reply is reported as "Server returned an unexpected HTML response" — usually a wrong API address.
* **User object** (`/auth/me/`, login): `role`, `track` (`in_camp`|`post_camp`|null), `lifecycle` (`state`, `isActive`, `stream`, `daysRemaining`, `daysToStart`, `reason`), `inCampAccessActive`, profile fields.
* **Streams:** `GET /streams/` (public, open streams), `/manage/streams/`, `/manage/stream-trainers/…`, `/manage/courses/<id>/review/`, `/reports/streams/`, `/reports/streams/export/`, `/incamp/dashboard/`.
* **Sign-up:** `POST /auth/signup/` with `accountMode` = `in_camp` (+ `streamId`, optional `campId`, skills; no LGA/PPA) or `post_camp` (state/LGA/PPA). Trainers: `POST /auth/trainer-signup/`.
* **Health probe used by the banner:** `GET /health/` → `{"status":"ok"}`.
* **Media:** lesson media URLs come from the API (short-lived signed links); the app fetches them with credentials and renders them in-page.
