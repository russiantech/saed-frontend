# SAED Frontend

React SPA for the NYSC Skills Acquisition and Entrepreneurship Development Information Management System.

## Stack

- React 19
- Create React App (`react-scripts`)
- React Router
- Lucide React icons
- Plain CSS (global `styles.css`)

## Setup

```bash
npm install
npm start       # http://localhost:3002
```

The dev server proxies `/api` requests to `http://127.0.0.1:8002` via `src/setupProxy.js`.

## Project Structure

```
src/
├── components/
│   ├── layout/            AppShell, FloatingNav, BackHome, DarkToggle
│   ├── auth/              AuthLayout, AuthError
│   ├── forms/             FormField, FormRow, SubmitButton, RoleSelector, StepIndicator, TermsCheckbox
│   └── ui/                DarkToggle
├── pages/
│   ├── auth/              Login, Signup, AdminSignup, ForgotPassword, VerifyEmail, InactiveAccount
│   ├── dashboard/         Dashboard
│   ├── admin/             ManageUsers, ManageApplications, ProgramEditor, DunisAdmin
│   ├── corper/            Applications, FindTrainers, ConnectTrainer, MyTrainers, TraineeFastTrack, PaymentCallback
│   ├── trainer/           MyCorpers, CourseManagement, CourseDetail, CorperProfile
│   ├── public/            Home, Activities, ActivityDetail, Opportunities, Programs, ProgramDetail
│   ├── forms/             SupportComplaintForm
│   └── profile/           Notifications, EditProfile, Profile
├── hooks/
│   ├── useAuthForm.js     Form state management hook
│   └── useToggleArray.js  Multi-select toggle hook
├── lib/
│   ├── api.js             Fetch wrapper with CSRF handling
│   └── auth.jsx           Auth context, login, signup, logout
├── constants/
│   ├── validators.js      Validation functions
│   └── constants.js       Skill areas, messages, validation rules
├── data/
│   ├── nigerianStates.js  All 37 Nigerian states and 774 LGAs
│   └── activities.js      Camp activity metadata
├── styles.css             Global styles
└── index.js               Router, routes, protected routes
```

## Routes

| Route | Access | Page |
|-------|--------|------|
| `/` | Public | Home |
| `/login` | Public | Login (requires verified email) |
| `/signup` | Public | Corps member & trainer signup |
| `/verify-email` | Public | 6-digit email OTP verification & auto-login |
| `/admin-signup` | Public | Admin signup (requires secret key) |
| `/programs` | Public | Program browsing |
| `/activities` | Public | Camp activities |
| `/forgot` | Public | Password reset (3-step code flow) |
| `/app` | Authenticated | Dashboard |
| `/app/programs` | Authenticated | Programs (apply or view) |
| `/app/applications` | Corps Member | My applications |
| `/app/manage-applications` | Admin/Trainer | Review applications |
| `/app/program-editor` | Admin | Course moderation (SAED Admin) / creation & editing (DUNIS Admin) |
| `/app/users` | Admin | User management |
| `/app/course-management` | Trainer | Course management |
| `/app/my-corpers` | Trainer | Connected corps members |
| `/app/dunis-admin` | DUNIS Admin | Payments & Fast Track administration |
| `/app/notifications` | Authenticated | Notifications |
| `/app/edit-profile` | Authenticated | Edit profile |

## Auth Flow

1. App loads → `GET /api/auth/me/` restores session
2. Login → `POST /api/auth/login/` with email + password (unverified users directed to `/verify-email`)
3. Signup (Corper, Trainer, Admin) → Dispatches 6-digit OTP verification code to registered email
4. Verification → Submitting 6-digit code at `/verify-email` verifies email, logs in session, and routes directly to role home:
   - Corper → `/app/dashboard`
   - Trainer → `/app/inactive-account` (under review) or `/app/dashboard` (active)
   - SAED Admin → `/app/dashboard`
   - DUNIS Admin → `/app/dunis-admin`
5. Protected routes redirect to `/login` if unauthenticated
6. Role-based guards redirect unauthorized users to appropriate role destination

## Roles

| Role | Screens |
|------|---------|
| Corps Member | Dashboard, Programs, Applications, Find Trainers, Fast Track, My Trainers, My Courses |
| Trainer | Dashboard, Course Management, My Corpers, Manage Applications |
| SAED Admin | Dashboard, User Management, Manage Applications, Program Editor (moderate/restrict only), Admin Courses, Refunds |
| DUNIS Admin | All admin screens + DUNIS Admin panel (payments, Fast Track activation, user activation, course creation/editing) |

## Commands

```bash
npm install          # install dependencies
npm start            # dev server on port 3002
npm run dev          # same as npm start
npm run build        # production build
npm test             # run tests (non-watch mode)
```

## Responsive Design

Fully responsive from 320px to desktop with breakpoints at:
- **1024px** — Grids reduce to 2 columns
- **768px** — Hero scales, detail pages stack
- **680px** — Sidebar collapses to hamburger menu
- **480px** — Forms and modals stack to single column
- **360px** — Ultra-compact layout

## Production

- Build with `npm run build`
- Serve the `build/` folder with a static server
- Ensure API proxy points to the deployed backend
- Configure CORS and CSRF on the backend for your frontend domain

See [documentation.md](documentation.md) for the full route reference, auth flow, role-based screens, and manual testing checklist.
