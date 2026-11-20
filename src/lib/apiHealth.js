import { API_BASE_URL } from "./config.js";

/**
 * Is the API actually reachable at API_BASE_URL?  Detects the classic misconfigurations:
 *   html    – the address answered with the web app's own HTML page (API_URL points at the frontend host)
 *   network – DNS/TLS/CORS failure or server down
 *   status  – the host answered with an error status
 */
export async function checkApi(base = API_BASE_URL, fetchImpl = globalThis.fetch) {
  try {
    const res = await fetchImpl(`${base}/health/`, { credentials: "omit", cache: "no-store" });
    const type = res.headers?.get?.("content-type") || "";
    if (/html/i.test(type)) return { ok: false, reason: "html", status: res.status };
    if (!res.ok) return { ok: false, reason: "status", status: res.status };
    const data = await res.json().catch(() => null);
    return data?.status === "ok" ? { ok: true } : { ok: false, reason: "html", status: res.status };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export const API_PROBLEM_TEXT = {
  html: "The app is calling its own website instead of the SAED server, so sign-in and data will not work.",
  network: "The app cannot reach the SAED server right now.",
  status: "The SAED server answered with an error.",
};
