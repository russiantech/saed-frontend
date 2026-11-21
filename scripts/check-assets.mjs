// Lists static files the app refers to that are missing from public/ (e.g. the camp-activity photos).
// Runs before every build. By default it only WARNS; use --strict to fail (CI of a repo that contains the photos).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dirs = ["src/data"];
const refs = new Map();
const re = /["'`](\/[A-Za-z0-9_\-./]+\.(?:jpe?g|png|webp|gif|svg|avif|mp4|pdf))["'`]/g;

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.(js|jsx|json)$/.test(e.name)) {
      for (const m of fs.readFileSync(f, "utf8").matchAll(re)) {
        if (!refs.has(m[1])) refs.set(m[1], path.relative(root, f));
      }
    }
  }
}
for (const d of dirs) if (fs.existsSync(path.join(root, d))) walk(path.join(root, d));

const missing = [...refs].filter(([url]) => !fs.existsSync(path.join(pub, url)));
if (!missing.length) {
  console.log(`check-assets: all ${refs.size} referenced static files exist in public/`);
} else {
  console.warn(`\ncheck-assets: ${missing.length} of ${refs.size} static files referenced by the app are NOT in public/:`);
  const byDir = {};
  for (const [url] of missing) (byDir[path.dirname(url)] ||= []).push(path.basename(url));
  for (const [d, files] of Object.entries(byDir)) console.warn(`  public${d}/  (${files.length}): ${files.slice(0, 4).join(", ")}${files.length > 4 ? ", ..." : ""}`);
  console.warn("Put these files in frontend/public/ (same paths) so every build ships them; see docs/STATIC-ASSETS.md.\n");
  if (process.argv.includes("--strict")) process.exit(1);
}
