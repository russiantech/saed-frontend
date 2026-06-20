
features/auth/
├── components/
│   ├── AuthLayout.jsx      ← Shared auth page wrapper (was AuthFrame in Login.jsx)
│   ├── AuthError.jsx       ← Reusable error display
│   ├── FormField.jsx       ← Universal input handler (text, email, password, select, textarea, file, checkbox)
│   ├── FormRow.jsx         ← Side-by-side field layout
│   ├── RoleSelector.jsx    ← Corps Member / Trainer toggle (deduplicated from Login & Signup)
│   ├── StepIndicator.jsx   ← Progress bars for multi-step forms
│   ├── SubmitButton.jsx    ← Consistent submit with loading state
│   └── TermsCheckbox.jsx   ← Terms agreement with links
├── hooks/
│   ├── useAuthForm.js      ← Reusable form state + validation + submission lifecycle
│   └── useToggleArray.js   ← Checkbox array toggle logic (trainer LGAs)
├── pages/
│   ├── Login.jsx           ← Cleaned, uses shared components
│   ├── Signup.jsx          ← Refactored: CorpsStep1, CorpsStep2, TrainerFields sub-components
│   ├── ForgotPassword.jsx  ← NEW: 3-step flow (Email → Verify → Reset → Success)
│   ├── VerifyEmail.jsx     ← Improved: auto-verify, resend, status states
│   ├── InactiveAccount.jsx ← Cleaned layout
│   └── TrainerSignupSuccess.jsx ← Cleaned layout
├── constants.js            ← SKILL_AREAS, EXPERIENCE_YEARS, VALIDATION regexes, MESSAGES
├── validators.js           ← validateFullName, validateEmail, validatePhone, etc.
└── index.js                ← Barrel export: import everything from one place.

