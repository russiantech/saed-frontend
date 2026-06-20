# Frontend Documentation

## Overview

The frontend is a React application for NYSC SAED IMS. It provides public pages, authentication screens, program discovery, protected dashboards, corps member application tracking, staff student-application checking, program management, application review, and admin-only trainer account management.

## Frontend Stack

- React 19
- Create React App / `react-scripts`
- React Router with `HashRouter`
- Lucide React icons
- Plain CSS in `src/styles.css`

## File Structure

```text
frontend/
  public/
    activities/
      inter-platoon.jpg
      morning-meditation.jpg
      passing-out.jpg
      registration.jpg
      religion.jpg
      skills-acquisition.jpg
      social.jpg
      sports.jpg
      swearing-in.jpg
    dunis-logo.png
    dunis-logo-dark.png
    index.html
    nysc.png
    nysc-dark.png
  src/
    components/
      AppShell.jsx
      BackHome.jsx
      CampActivities.jsx
      DarkToggle.jsx
      FloatingNav.jsx
      PasswordInput.jsx
      UnauthorizedPage.jsx
    data/
      activities.js
      nigerianStates.js
    lib/
      api.js
      auth.jsx
    pages/
      Activities.jsx
      ActivityDetail.jsx
      Applications.jsx
      Dashboard.jsx
      Forgot.jsx
      Home.jsx
      Login.jsx
      ManageApplications.jsx
      ManageUsers.jsx
      Opportunities.jsx
      ProgramEditor.jsx
      Programs.jsx
      Signup.jsx
      TrainerSignup.jsx
      ManageApplications.test.jsx
      ManageUsers.test.jsx
      ProgramEditor.test.jsx
    index.js
    main.jsx
    styles.css
  .env
  documentation.md
  package.json
  package-lock.json
```

## Important Files

- `src/main.jsx`: App entry point, routes, protected route wrapper, and theme initialization (theme is applied before React mounts to prevent a flash of the wrong theme on hard refresh).
- `src/lib/api.js`: Fetch wrapper for API requests. It prefers the same-origin `/api` proxy in development, clears cached CSRF tokens after auth changes, and retries once on CSRF-specific `403` responses.
- `src/lib/auth.jsx`: Auth context, session loading, login, signup, logout, and password reset helpers.
- `src/components/AppShell.jsx`: Authenticated app layout and navigation. The sidebar collapses into a hamburger menu on small screens.
- `src/components/PasswordInput.jsx`: Reusable password input with an eye button for showing or hiding typed passwords. Used by login, signup, password reset, and trainer creation forms.
- `src/components/CampActivities.jsx`: Reusable camp activities grid used by the public `/activities` page. Cards show only the first sentence of descriptions.
- `src/data/activities.js`: Static metadata (id, title, description, hero image, optional image gallery, optional `exploreHref` CTA) for each camp activity. Activities are referenced by `id` from the route `/activities/:id`.
- `src/pages/Home.jsx`: Public landing page.
- `src/pages/Activities.jsx`: Public camp activities listing.
- `src/pages/ActivityDetail.jsx`: Public detail page for a single camp activity.
- `src/pages/Opportunities.jsx`: Public opportunities page with 48 real NYSC listings from LinkedIn, MyJobMag, Jobberman, and company career pages. Cards show only the first sentence of each listing.
- `src/pages/Forgot.jsx`: Public password reset page.
- `src/pages/Login.jsx`: Shared login form for all account types. No admin sign-in selector is shown.
- `src/pages/Signup.jsx`: Corps member signup flow with step-by-step registration including Nigerian state and LGA dropdowns.
- `src/pages/TrainerSignup.jsx`: Trainer self-registration page.
- `src/pages/Dashboard.jsx`: Authenticated dashboard. Trainers also see a `trainerPrograms` section listing the programs they are assigned to and their applications.
- `src/pages/Programs.jsx`: Public and protected program browsing. Corps members can apply; admins/trainers view details. Trainers only see their assigned programs. Cards show only the first sentence of program descriptions.
- `src/pages/Applications.jsx`: Corps member application tracking.
- `src/pages/ManageApplications.jsx`: Admin/trainer application review with status filters. For trainers the action buttons are disabled for applications already marked `completed`; admins can still approve, decline, or re-mark a completed application. Relevant CSS classes: `.filter-row`, `.filter-buttons`, `.filter-buttons button.active`, and `.icon-action[disabled]`.
- `src/pages/ProgramEditor.jsx`: Admin-only program management (create + edit). Uses a compact sticky form on desktop.
- `src/pages/ManageUsers.jsx`: Admin-only trainer account creation and user activation management. The current admin's own deactivate and role-change actions are disabled. Includes authorization status column and authorize/deauthorize toggle for trainers.
- `src/components/UnauthorizedPage.jsx`: Full page unauthorized state with payment status and "Pay Authorization Fee" button (scaffolded for future Paystack integration).
- `src/data/nigerianStates.js`: Complete dataset of all 37 Nigerian states and their 774 LGAs for the signup flow dropdowns.
- `src/styles.css`: Main styling for public pages, auth pages, dashboards, forms, tables, and comprehensive responsive behavior.

### Responsive Design

The site is fully responsive across all screen sizes (320px to desktop) with breakpoints at:

- **1024px**: Program, activity, and opportunity grids reduce from 3 to 2 columns; opportunity image height reduced.
- **768px**: Hero heading scales down; stats band stacks; activity/program detail grids become single-column; editor layout adjusts.
- **680px**: FloatingNav collapses to hamburger; dashboard sidebar becomes a sticky top bar with hamburger toggle.
- **480px**: Auth pages fill screen width; modal padding reduced; program editor stacks list/form vertically; forms and management rows become single-column.
- **360px**: Ultra-compact padding and font sizes throughout; buttons stack vertically.

Additional responsive features:

- `@media (prefers-reduced-motion)`: Disables hover animations for accessibility.
- `@media (orientation: landscape) and (max-height: 500px)`: Reduces hero height for landscape phones.
- `@media print`: Hides navigation and non-essential UI for printing.
- Category tabs scroll horizontally with `scroll-snap` on mobile instead of wrapping.
- Dashboard sidebar becomes a sticky top bar with hamburger menu on mobile.
- Dashboard stat cards use `minmax(180px, 1fr)` grid to prevent overflow on small screens.

The authenticated app navigation collapses into a hamburger menu on smaller screens. This prevents the sidebar links from overflowing horizontally.

Password fields on login, signup, password reset, and trainer creation use an eye button so users can check what they typed.

## Routes

The frontend uses `HashRouter`, so browser URLs use hash fragments such as `/#/app`.

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Home page. |
| `/activities` | Public | Camp activities listing. |
| `/activities/:id` | Public | Detail page for a single camp activity. |
| `/opportunities` | Public | Opportunities page. |
| `/forgot` | Public | Password reset page. |
| `/login` | Public | Email/password login for all roles. |
| `/signup` | Public | Corps member signup with step-by-step registration. |
| `/trainer-signup` | Public | Trainer self-registration (requires admin authorization). |
| `/programs` | Public | Public program browsing. |
| `/app` | Authenticated | Dashboard. |
| `/app/programs` | Authenticated | Corps member application actions; admin/trainer program detail viewing. Trainers only see their assigned programs. |
| `/app/applications` | Corps Member | Application tracking. |
| `/app/manage-applications` | Admin/Trainer | Review applications, with status filters (All, Pending, Approved, Declined, Completed). |
| `/app/program-editor` | Admin | Create and edit programs. Trainers are not allowed. |
| `/app/users` | Admin | Create trainer accounts, manage access, and authorize/deauthorize trainers. |

## Auth Flow

1. The app calls `/api/auth/me/` on load to restore an existing Django session.
2. Login posts email and password to `/api/auth/login/`.
3. Signup creates corps member accounts with step-by-step registration including Nigerian state and LGA dropdowns.
4. Trainers can self-register at `/trainer-signup` but require admin authorization before accessing most features.
5. Admin users access `/app/users` from the sidebar after logging in normally.
6. The frontend hides the Users link unless the current user's role is `admin`.
7. Admin and trainer users do not submit applications from the frontend.
8. Protected pages redirect unauthenticated users to `/login`.
9. The route guard also redirects to `/login` (or the role's home) when a logged-in user lacks the required role for a page (for example, a trainer visiting `/app/users` or `/app/program-editor`).
10. Unauthorized trainers see a "Account Pending Authorization" page inside the app shell (sidebar remains visible).

## Role-Based Screens

- Corps members see `Apply Now` on `/app/programs` and can submit applications.
- Admins and trainers see `View Details` on `/app/programs`; the details modal shows duration, capacity, available slots, trainer, location, and active status.
- Trainers only see programs they are assigned to on `/app/programs`, `/app/applications`, and the dashboard.
- Corps members use `/app/applications` to track their own applications.
- Admins and trainers use `/app/manage-applications` to review student applications. The page includes filter buttons (All, Pending, Approved, Declined, Completed) for quick filtering; action buttons are disabled for applications already marked `completed` to enforce immutability. Relevant CSS classes: `.filter-row`, `.filter-buttons`, `.filter-buttons button.active`, and `.icon-action[disabled]`.
- Trainers see their assigned programs on the dashboard under a `trainerPrograms` section, including the applications for each program.
- Admins use `/app/users` to create trainers, manage access, and authorize/deauthorize self-registered trainers. The page includes an authorization status column and an "Authorize" toggle button.
- The current admin's own deactivate action and role-change action are disabled in `/app/users`.
- Unauthorized trainers see a "Account Pending Authorization" page inside the app shell (sidebar remains visible) with payment status and a "Pay Authorization Fee" button (scaffolded).

## Program Editor Layout

`/app/program-editor` is admin-only. It uses a fixed-height desktop panel. The program list can scroll, while the creation/edit form is compact and sticky so it fits inside the app viewport without internal form scrolling. On smaller screens, the layout becomes normal vertical flow. When a trainer is selected in the form, the API keeps the program in sync with the trainer account.

## Activity Detail Page

`/activities/:id` opens a dedicated page for a single camp activity. The page renders the activity's hero image, full description, and (when available) an image gallery and an `exploreHref` CTA, sourced from `src/data/activities.js`. Unknown activity ids fall back to a friendly "Activity not found" panel with a link back to `/activities`.

## Card Description Behavior

All card-based pages (Programs, Opportunities, Camp Activities) display only the first sentence of descriptions using a `firstSentence()` helper that extracts text up to the first period. If no period is found, descriptions are truncated to 120 characters with an ellipsis. Full descriptions are shown on the respective detail pages: `/programs/:id`, `/activities/:id`, and external opportunity links.

## Responsive Layout

The entire site is fully responsive from 320px mobile to desktop. Responsive CSS is defined in `src/styles.css` with breakpoints at 1024px, 768px, 680px, 480px, and 360px. The dashboard sidebar becomes a sticky top bar on mobile with a hamburger toggle. Grids gracefully cascade from 3 columns to 2 to 1. Forms and management rows stack to single-column on narrow screens. The floating nav shrinks and collapses to a hamburger menu on small screens. A `prefers-reduced-motion` query disables hover animations for accessibility.

## API Proxy

`package.json` contains:

```json
"proxy": "http://127.0.0.1:8002"
```

During local development, frontend requests to `/api/...` are proxied to the Django server.

The API wrapper clears cached CSRF tokens after login, signup, and logout because Django can rotate the CSRF token during authentication. If a write request receives a CSRF-specific `403`, it fetches a fresh token and retries once.

## Commands

Install dependencies:

```powershell
cd frontend
npm install
```

Start frontend dev server:

```powershell
cd frontend
npm start
```

Run frontend tests:

```powershell
cd frontend
npm test
```

The test runner is configured to not watch (`react-scripts test --watchAll=false`).

Build production frontend:

```powershell
cd frontend
npm run build
```

Frontend URL:

```text
http://127.0.0.1:3001/
```

## Manual Testing Checklist

- Login page has no admin sign-in option.
- Admin can log in with email/password.
- Password fields can be shown and hidden with the eye button.
- Admin can create a trainer from `/app/users`.
- Admin cannot deactivate their own account from `/app/users`.
- Authenticated navigation is collapsible with a hamburger on small screens.
- Trainer cannot access `/app/users`.
- Trainer cannot access `/app/program-editor` (route guard redirects to the dashboard).
- Admin/trainer sees `View Details` instead of `Apply Now` on `/app/programs`.
- Admin/trainer cannot submit program applications.
- Trainers only see their assigned programs on `/app/programs`, the dashboard, and `/app/applications`.
- Trainers see assigned programs and their applications on the dashboard.
- Admin/trainer can review applications in `/app/manage-applications` and use the status filter buttons.
- A completed application is read-only: the action buttons on `/app/manage-applications` are disabled.
- Admin can create and edit programs in `/app/program-editor` and assign a trainer from the dropdown.
- Application review actions do not fail with stale CSRF after login.
- Program editor form fits in the desktop viewport without scrolling the form.
- Corps member can sign up from `/signup` with step-by-step registration including state/LGA dropdowns and NYSC state code field.
- Corps member can browse programs and apply.
- User can view applications in `/app/applications`.
- `/activities/:id` opens the detail page for the matching camp activity.
- Program, opportunity, and activity cards show only the first sentence; full descriptions appear on detail pages.
- Opportunities page displays 48 real NYSC listings with external application links.
- Site is fully responsive from 320px to desktop; dashboard sidebar becomes a sticky top bar on mobile.
- Hero background uses a CSS gradient (no external image dependency).
- Trainer can self-register at `/trainer-signup`.
- Unauthorized trainer sees "Account Pending Authorization" page with payment status and "Pay Authorization Fee" button.
- Admin can authorize/deauthorize trainers from `/app/users`.
- Nigerian state and LGA dropdowns work correctly in signup flow.

## Production Notes

- Build with `npm run build`.
- Serve the generated build with a production web server.
- Point API requests to the deployed backend.
- Confirm the backend CORS and CSRF settings include the deployed frontend origin.
- Keep frontend environment values out of source control when they contain deployment-specific secrets or private URLs.
