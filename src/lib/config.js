// Runtime + build-time configuration.
//
// The API address is resolved in this order:
//   1. window.__SAED_CONFIG__.API_URL   – public/config.js, editable AFTER the build (no rebuild needed)
//   2. VITE_API_URL                     – baked in at build time
//   3. "/api"                           – same-origin (dev server / nginx proxy)
//
// A browser app that is hosted on a different domain than the API MUST use an absolute URL
// (e.g. https://saed-api.example.com/api). A relative "/api" then points at the *frontend's own host*,
// which is exactly the "works locally, fails in production" failure.

/** Pure helper (unit-tested): choose and normalise the API base. */
export function resolveApiBase(runtimeValue, buildValue) {
  let v = String(runtimeValue || buildValue || "/api").trim();
  if (!v) v = "/api";
  v = v.replace(/\/+$/, "");
  // "https://api.example.com" (host only) -> ".../api"
  if (/^https?:\/\/[^/]+$/i.test(v)) v += "/api";
  return v || "/api";
}

const runtime = typeof window !== "undefined" ? window.__SAED_CONFIG__ || {} : {};

export const API_BASE_URL = resolveApiBase(runtime.API_URL, import.meta.env.VITE_API_URL);

/** True when the API lives on another origin than this page (cookies then need cross-site settings on the server). */
export function isCrossOriginApi(base = API_BASE_URL, origin = typeof window !== "undefined" ? window.location.origin : "") {
  if (!/^https?:\/\//i.test(base)) return false;
  try { return new URL(base).origin !== origin; } catch { return false; }
}
