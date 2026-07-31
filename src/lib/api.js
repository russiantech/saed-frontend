

// api.js — v4
// KEY FIXES (this revision):
// 1. Adds primeCsrfToken() — an explicit, exported way to fetch and cache
//    the CSRF cookie/token up front (called once at app startup from
//    auth.jsx), instead of relying on it being fetched lazily by whichever
//    call site happens to make the first unsafe request. This is what makes
//    CSRF behavior consistent across login, signup, and every other POST —
//    the token is guaranteed to exist before any page-level code runs.
// 2. CSRF-failure recovery no longer depends on a hardcoded path list.
//    Previously only /auth/login/, /auth/signup/, /auth/logout/ cleared the
//    cached token after use; now ANY 403 whose body indicates a CSRF
//    failure clears the cache, regardless of which endpoint hit it. This
//    removes the "works on this call site, not that one" inconsistency.
// 3. isAuthPath() and the post-success cache-clear block are removed —
//    they're now redundant given fix #2, and kept the token invalidation
//    logic scattered across two different mechanisms.
//
// Carried over from v3:
// - suppressAuthErrors(bool) so auth.jsx can mute 401 broadcasts during the
//   initial /me/ hydration window, preventing a redirect loop.
// - No duplicate `error.status` assignment in createApiError.

// ============================================================
// Environment Variables:
//
// Development:
// REACT_APP_API_URL=http://127.0.0.1:8002/api
// (Should match whatever host you actually open the frontend at —
//  localhost vs 127.0.0.1 mismatches used to cause cookie issues in dev;
//  since SESSION_COOKIE_SAMESITE/SECURE are now fixed in settings.py this
//  is no longer strictly required, but keeping them aligned avoids
//  reintroducing that class of bug.)
//
// Production:
// REACT_APP_API_URL=https://saed-api.simplylovely.ng/api
// ============================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

let csrfToken = "";
// Tracks an in-flight CSRF fetch so concurrent callers (e.g. primeCsrfToken()
// racing a page's own first POST) share one request instead of firing two.
let csrfFetchPromise = null;

// ============================================================
// Auth-error broadcast
// ============================================================

const authErrorHandlers = new Set();
// When true, 401s are recorded but not broadcast. Set to true during the
// initial session-check so transient 401s don't trigger logout.
let authErrorsSuppressed = false;

export function suppressAuthErrors(suppress) {
  authErrorsSuppressed = suppress;
}

export function onAuthError(handler) {
  authErrorHandlers.add(handler);
  return () => authErrorHandlers.delete(handler);
}

// ============================================================
// CSRF Token Management
// ============================================================

async function fetchCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  // Share one in-flight request instead of letting multiple callers each
  // fire their own GET /csrf/ at the same time.
  if (csrfFetchPromise) {
    return csrfFetchPromise;
  }

  csrfFetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf/`, {
        credentials: "include",
      });

      if (!response.ok) {
        return "";
      }

      const data = await response.json();
      csrfToken = data?.csrfToken || "";
      return csrfToken;
    } catch {
      return "";
    } finally {
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
}

// Public entry point for priming the CSRF cookie/token before any page-level
// code runs. Call this once, at app startup (see auth.jsx), alongside the
// initial /auth/me/ hydration — not on a per-page or per-call-site basis.
export async function primeCsrfToken() {
  return fetchCsrfToken();
}

function clearCsrfToken() {
  csrfToken = "";
}

// ============================================================
// Request Helpers
// ============================================================

function isSafeMethod(method) {
  return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2
        ? parts.pop().split(";").shift()
        : "";
}

function buildHeaders(options = {}, method = "GET") {
  const headers = { ...(options.headers || {}) };

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!isSafeMethod(method) && csrfToken) {
    // headers["X-CSRFToken"] = csrfToken;
    headers["X-CSRFToken"] = getCookie("csrftoken");
  }

  return { headers, isFormData };
}

function buildBody(options = {}, isFormData = false) {
  if (options.body == null) {
    return undefined;
  }
  return isFormData ? options.body : JSON.stringify(options.body);
}

// ============================================================
// Response Parsing
// ============================================================

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return { data: {}, text: "" };
  }

  try {
    return { data: JSON.parse(text), text };
  } catch {
    const isHtml =
      text.trim().startsWith("<!DOCTYPE html") ||
      text.trim().startsWith("<html");

    return {
      data: isHtml
        ? {
            error:
              response.status === 404
                ? "API endpoint not found."
                : "Server returned an unexpected HTML response.",
          }
        : { message: text },
      text,
    };
  }
}

// ============================================================
// Error Handling
// ============================================================

function createApiError(response, data, text) {
  let message = data?.error || data?.detail || data?.message;

  if (!message) {
    switch (response.status) {
      case 400:
        message = "Invalid request.";
        break;
      case 401:
        message = "Authentication required.";
        break;
      case 403:
        message = "Permission denied.";
        break;
      case 404:
        message = "API endpoint not found.";
        break;
      case 500:
        message = "Internal server error.";
        break;
      default:
        message = `Request failed with status ${response.status}.`;
    }
  }

  const error = new Error(message);
  error.status = response.status;
  error.data = data;
  error.raw = text;

  if (response.status === 401 && !authErrorsSuppressed) {
    authErrorHandlers.forEach((h) => h());
  }

  return error;
}

function isCsrfFailure(response, text = "") {
  return response.status === 403 && text.toLowerCase().includes("csrf");
}

// ============================================================
// Main API Function
// ============================================================

export async function api(path, options = {}) {
  const method = options.method || "GET";

  if (!isSafeMethod(method)) {
    await fetchCsrfToken();
  }

  const { headers, isFormData } = buildHeaders(options, method);
  const body = buildBody(options, isFormData);

  try {
    let response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers,
      body,
    });

    let { data, text } = await parseResponse(response);

    // ── Automatic CSRF Retry ──────────────────────────────────
    // Applies to every path uniformly — not just a hardcoded list of
    // "auth" endpoints. Any unsafe request can hit a stale-token 403.
    if (!response.ok && isCsrfFailure(response, text)) {
      clearCsrfToken();
      const freshToken = await fetchCsrfToken();

      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        credentials: "include",
        headers: { ...headers, "X-CSRFToken": freshToken },
        body,
      });

      ({ data, text } = await parseResponse(response));
    }

    // ── Handle API Errors ─────────────────────────────────────
    if (!response.ok) {
      // If we still failed on CSRF after a retry, drop the cached token so
      // the *next* request starts clean rather than retrying with the same
      // bad value again.
      if (isCsrfFailure(response, text)) {
        clearCsrfToken();
      }
      throw createApiError(response, data, text);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      console.error("API Network Error:", error);
      throw new Error(
        "Unable to connect to the server. Please verify that the backend is running and accessible."
      );
    }
    throw error;
  }
}

// ============================================================
// Convenience Methods
// ============================================================

export const get = (path, options = {}) =>  api(path, { ...options, method: "GET" });

export const post = (path, options = {}) => api(path, { ...options, method: "POST" });

export const put = (path, options = {}) => api(path, { ...options, method: "PUT" });

export const patch = (path, options = {}) =>  api(path, { ...options, method: "PATCH" });

export const del = (path, options = {}) =>  api(path, { ...options, method: "DELETE" });
