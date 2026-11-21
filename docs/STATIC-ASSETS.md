# Static files (images, icons) - where they live and how they get deployed

Everything the browser loads from your own site (not from the API) must be inside **`public/`**. Vite copies `public/` into `build/`
unchanged, so what is in `public/` is exactly what ends up on the server.

| Path in the app | File in the repo |
|---|---|
| `/activities/<id>.jpg` (card photo) | `public/activities/<id>.jpg` |
| `/activities/<id>/1.jpg … 6.jpg` (gallery) | `public/activities/<id>/1.jpg … 6.jpg` |
| `/logo.png`, `/favicon-*.png`, `/pwa-*.png` | `public/` |

Activity ids: `registration, swearing-in, morning-meditation, skills-acquisition, sports, social, inter-platoon, religion, passing-out`
(see `src/data/activities.js`) - 9 card photos + 9 × 6 gallery photos = **63 files**.

## The camp-activity photos
These photos were **not part of the project files that were refactored**, so they are not in this repository. If they are on your
live server (web root `activities/` folder) or in your original project's `public/activities/`, copy that folder into
`frontend/public/activities/` (keeping the file names). From then on every `npm run build` ships them and a deploy can never remove them.

Until then the pages show a neutral placeholder for each missing photo instead of a broken image.

## Checking
```bash
npm run check:assets            # lists every referenced file missing from public/ (also runs before each build)
node scripts/check-assets.mjs --strict   # exit code 1 if any is missing (use in CI once the photos are committed)
```

## Deploying without losing files
Upload the **contents of `build/`** to the web root. Do not empty the web root first unless `public/` contains everything the site needs;
otherwise folders that only exist on the server (such as `activities/`) disappear. After uploading, open one photo URL directly, e.g.
`https://saed.dunistech.ng/activities/registration.jpg` - it must show the picture (a missing file now returns a real 404, not the app page).
