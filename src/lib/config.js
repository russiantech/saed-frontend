// Runtime + build-time configuration.
//
// The API address is chosen per ENVIRONMENT, automatically, from the host name the app is opened on:
//   1. window.__SAED_CONFIG__.API_URL          explicit override (wins over everything)
//   2. window.__SAED_CONFIG__.API_URLS[host]   per-environment table in public/config.js, e.g.
//                                                "saed.dunistech.ng": "https://saed-api.simplylovely.ng/api"
//                                                "*.staging.example.com": "https://api.staging.example.com/api"
//   3. VITE_API_URL                            build-time value (.env.development / .env.production)
//   4. "/api"                                  same-origin (dev server proxy, or nginx proxying /api)
//
// A browser app hosted on a different domain than the API MUST end up with an absolute URL; a relative "/api"
// would point at the web app's own host (the classic "works locally, fails in production").

const strip = (v) => String(v || "").trim();

/** Look the host up in a table: exact match first, then "*.suffix" wildcards (longest suffix wins). */
export function lookupByHost(table, hostname) {
  if (!table || typeof table !== "object" || !hostname) return "";
  const host = hostname.toLowerCase();
  const exact = Object.keys(table).find((k) => k.toLowerCase() === host);
  if (exact) return strip(table[exact]);
  const wild = Object.keys(table)
    .filter((k) => k.startsWith("*.") && host.endsWith(k.slice(1).toLowerCase()))
    .sort((a, b) => b.length - a.length)[0];
  return wild ? strip(table[wild]) : "";
}

/** Pure helper (unit-tested): choose and normalise the API base. */
export function resolveApiBase(runtime = {}, buildValue = "", hostname = "") {
  let v = strip(runtime.API_URL) || lookupByHost(runtime.API_URLS, hostname) || strip(buildValue) || "/api";
  v = v.replace(/\/+$/, "");
  if (/^https?:\/\/[^/]+$/i.test(v)) v += "/api";          // host only -> append /api
  return v || "/api";
}

const runtime = typeof window !== "undefined" ? window.__SAED_CONFIG__ || {} : {};
const hostname = typeof window !== "undefined" ? window.location.hostname : "";

export const API_BASE_URL = resolveApiBase(runtime, import.meta.env.VITE_API_URL, hostname);

/** True when the API lives on another origin than this page (cookies then need cross-site settings on the server). */
export function isCrossOriginApi(base = API_BASE_URL, origin = typeof window !== "undefined" ? window.location.origin : "") {
  if (!/^https?:\/\//i.test(base)) return false;
  try { return new URL(base).origin !== origin; } catch { return false; }
}

/**
 * Turn a URL that came from the API into one the browser can fetch from HERE.
 *  - "/api/..." or "/media/..." (relative to the API host, e.g. partnership letters) -> prefixed with the API origin
 *    when the API is on another host; unchanged when it is proxied same-origin.
 *  - absolute URL on the API host while the app proxies /api same-origin -> reduced to its path (keeps one origin).
 *  - blob:, data:, external links, the app's own static files -> untouched.
 */
export function resolveMediaUrl(url, base = API_BASE_URL) {
  if (!url || typeof url !== "string" || /^(blob:|data:)/i.test(url)) return url;
  const apiIsAbsolute = /^https?:\/\//i.test(base);
  if (url.startsWith("/") && !url.startsWith("//")) {
    if (!apiIsAbsolute || !/^\/(api|media)\//.test(url)) return url;
    try { return new URL(base).origin + url; } catch { return url; }
  }
  if (!apiIsAbsolute && /^https?:\/\//i.test(url)) {
    try { const u = new URL(url); return u.pathname + u.search; } catch { return url; }
  }
  return url;
}
