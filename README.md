# SAED Learning Platform — Backend

**Django REST API** powering the Skills Acquisition & Entrepreneurship Development (SAED) platform for NYSC corps members, trainers, and SAED / Dunis administrators.

**Version:** 2.5.0  
**Stack:** Python 3.12+, Django, Django REST Framework, PostgreSQL / SQLite, Paystack, private media storage

---

## Overview

The backend provides a secure, role-based API that supports two completely separate experiences:

| Track        | Who it is for                          | Key behaviour |
|--------------|----------------------------------------|---------------|
| **In-Camp**  | Corps members & trainers during orientation camp | Time-bound by **Streams** (up to 6 per year). Accounts auto-deactivate after the stream ends (+ optional grace period). No LGA/PPA required at sign-up. |
| **Post-Camp**| Corps members & trainers after camp    | Ongoing access. Full location (state, LGA, PPA) used for discovery and matching. |

Accounts belong to **exactly one** track. Crossing tracks returns `403`. Admins see both.

### Core concepts

- **Streams** — SAED Admin creates streams (year + number 1–6, start/end dates, grace days). All In-Camp life-cycles, camps, courses, trainers and reports are scoped to a stream.
- **Courses → Lessons** — Flat structure. A lesson is free unless locked with a price. No modules, no course-level price, no Fast Track.
- **Payments** — Unified ledger (trainer activation, video upload fee, lesson access). Paystack verified server-side; signed idempotent webhook; bank-transfer confirmation by trainers.
- **Private media** — Lesson videos/documents and partnership letters live in private storage and are streamed only after entitlement checks (HTTP Range supported).

---

## Repository layout

```
backend/
├── saed/                 # Main Django app
│   ├── models/           # Stream, StreamMembership, Course, Lesson, Payment, Profile, …
│   ├── views/            # Role-aware viewsets and function views
│   ├── services/         # Paystack, deactivation, proposals, reports
│   ├── serializers/
│   ├── permissions/
│   ├── management/commands/  # deactivate_incamp, move_partnership_letters, export_openapi
│   └── tests/
├── config/               # Reference settings, URLs, WSGI (harness for running/tests)
├── manage.py
├── requirements.txt
└── .env.example
```

---

## Quick start (local)

**Requirements:** Python 3.12+, pip, virtualenv. PostgreSQL optional (SQLite is the default).

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env               # Set DJANGO_DEBUG=1 for local work
python manage.py migrate
python manage.py runserver 127.0.0.1:8002
```

API base: `http://127.0.0.1:8002/api/`  
Interactive docs (when `API_DOCS=public`): `http://127.0.0.1:8002/docs/`

### Database

| Engine     | `DATABASE_URL`                          |
|------------|-----------------------------------------|
| SQLite     | `sqlite:///db.sqlite3` (default)        |
| PostgreSQL | `postgres://user:pass@host:5432/saed`   |

The same code, migrations and test suite run on both. Use PostgreSQL for concurrent production traffic.

### Environment

All settings are environment-driven. See `.env.example` for the full list. Critical variables:

- `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` (required when `DJANGO_DEBUG` is off)
- `FRONTEND_URL`, `BACKEND_URL`, `CORS_*`, `CSRF_TRUSTED_ORIGINS`
- `PRIVATE_MEDIA_ROOT` (lesson files & letters — never expose publicly)
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
- `REDIS_URL` (recommended when running multiple workers)
- `API_DOCS` = `public` | `staff` | `off`

---

## Authentication & roles

- **Session-cookie authentication.** `POST /api/auth/login/` sets the session cookie.
- **All unsafe methods** (POST/PUT/PATCH/DELETE) require the `X-CSRFToken` header. Obtain it from `GET /api/csrf/`.
- Roles: `corps_member`, `trainer`, `saed_admin`, `dunis_admin`.

| Role          | Typical capabilities |
|---------------|----------------------|
| Corps member  | Enrol, learn, connect to trainers, pay for premium lessons |
| Trainer       | Create/manage own courses & lessons, confirm bank transfers, view earnings |
| SAED Admin    | Streams, In-Camp trainers (CRUD + invite/reactivate), proposals, reports, users, camps |
| Dunis Admin   | Everything SAED Admin can do + platform fees, payment mismatch review, refunds |

---

## Streams & In-Camp life-cycle (v2.5)

1. **SAED Admin** creates a Stream (`year` + `number` 1–6, `startDate` / `endDate`, optional `deactivationGraceDays`).
2. Orientation camps and In-Camp courses are attached to a stream.
3. **In-Camp trainers** are created only by admin (stream, name, email, phone, optional password). An invitation email is sent with a set-password link. Full CRUD + deactivate / reactivate / re-invite.
4. **Corps members** sign up via the In-Camp flow (stream required, camp optional, **no LGA/PPA**).
5. While the stream is active the portal shows the window and days remaining.
6. After `endDate` + grace the account is deactivated. The dashboard becomes an “ended” page; most other endpoints return `403 stream_expired`. Profile, notifications and complaints remain reachable.
7. A trainer admitted to a new stream can be **re-activated**.
8. Daily job (or manual trigger): `python manage.py deactivate_incamp` or `POST /api/admin/run-stream-expiry/`.

Expiry is also enforced live from the dates, so access is cut off on time even if the job has not yet run.

### Proposals

In-Camp trainers submit what they will teach for the stream. The course stays hidden until a SAED Admin **approves** (publishes) or **declines** (with a note). Editing a declined proposal resubmits it.

### Reports

`GET /api/reports/streams/` (and CSV export) — per-stream and yearly summaries of corps members, trainers, courses, enrolments, skills, camps, top courses. Post-Camp is reported separately.

---

## Payments (summary)

- Amounts are in **kobo**. The server verifies against the amount *it requested* (not the final Paystack amount that may include customer-borne fees).
- Real mismatches are flagged `amount_mismatch` for Dunis Admin review; the user is told the payment is under review and has not lost money.
- Webhook: `POST /api/webhooks/paystack/` — HMAC-SHA512 signature, idempotent by event id.
- Video upload fee (default ₦2,000, once per lesson) is paid by the **trainer** and can be disabled by Dunis Admin.

---

## Media & security

- Lesson media and partnership letters are stored under `PRIVATE_MEDIA_ROOT`.
- Streaming endpoint: `GET /api/lessons/{id}/media/{kind}/` — entitlement checked on every request, supports Range.
- Partnership letters: `GET /api/users/{id}/partnership-letter/` (owner + admins only).
- Never serve `PRIVATE_MEDIA_ROOT` from the web server.

---

## API documentation

Generated from the live URLconf (a test fails if a route is undocumented).

| URL                     | Description                          |
|-------------------------|--------------------------------------|
| `/api/docs/`            | Swagger UI (CSRF header auto-added)  |
| `/api/redoc/`           | ReDoc                                |
| `/api/openapi.json`     | OpenAPI 3.1 document                 |
| `docs/API.md`           | Human-readable offline copy          |

Regenerate offline docs:

```bash
python manage.py export_openapi
```

---

## Health & ops

- `GET /api/health/` — liveness
- `GET /api/health/ready/` — database + private media writable (returns 503 when not ready)
- Auth endpoints are throttled (`AUTH_THROTTLE_RATE`, default 30/min per IP).
- Production checklist, Docker Compose, nginx notes and migration guides live in the root `docs/` folder of the monorepo / product documentation.

### Scheduled job (required for clean expiry records)

```bash
# cron or Task Scheduler — daily
python manage.py deactivate_incamp
```

---

## Tests

```bash
python manage.py check
python manage.py test                 # full suite (SQLite)
DATABASE_URL=postgres://... python manage.py test
```

Current coverage includes streams/tracks/life-cycle, proposals, reports, payments, webhook races, private media streaming, and query-budget regressions.

---

## Integrating into an existing Django project

1. Copy the `saed/` package.
2. Ensure your settings contain the items documented in `config/settings.py` (INSTALLED_APPS, SessionAuthentication, FRONTEND_URL, PRIVATE_MEDIA_ROOT, PAYSTACK_*, email, CORS/CSRF, etc.).
3. Include the routes: `path("api/", include("saed.urls"))`.
4. Run migrations and the daily deactivation job.

---

## Related documentation

- [API.md](../docs/API.md) — full endpoint reference
- [CHANGES.md](../docs/CHANGES.md) — version history
- [MIGRATION.md](../docs/MIGRATION.md) — schema & data migration notes
- [TESTING.md](../docs/TESTING.md) — payment & content testing guide
- [IN_CAMP_SAED.md](../docs/IN_CAMP_SAED.md) — non-technical summary of the In-Camp / Streams update

---

**License:** Proprietary  
**Maintainers:** SAED / Dunis platform team
