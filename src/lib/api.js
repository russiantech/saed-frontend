// src/lib/api.js — session + CSRF aware API client.

import { API_BASE_URL, resolveMediaUrl } from "./config.js";
export { API_BASE_URL, resolveMediaUrl };

let csrfToken = "";
let csrfFetchPromise = null;

const authErrorHandlers = new Set();
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

async function fetchCsrfToken(force = false) {
  if (csrfToken && !force) return csrfToken;
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf/`, { credentials: "include" });
      if (!response.ok) return "";
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

function buildHeaders(options = {}, method = "GET") {
  const headers = { ...(options.headers || {}) };

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!isSafeMethod(method) && csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
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
  const authenticationFailure = isAuthenticationFailure(response, data);
  error.status = authenticationFailure ? 401 : response.status;
  error.data = data;
  error.raw = text;

  if (authenticationFailure && !authErrorsSuppressed) {
    clearCsrfToken();
    authErrorHandlers.forEach((h) => h());
  }

  return error;
}

function isAuthenticationFailure(response, data) {
  if (response.status === 401) return true;
  if (response.status !== 403) return false;

  const detail = String(data?.detail || data?.error || data?.message || "").toLowerCase();
  return (
    detail.includes("authentication credentials were not provided") ||
    detail.includes("session has expired")
  );
}

function isCsrfFailure(response, text = "") {
  return response.status === 403 && text.toLowerCase().includes("csrf");
}

// ============================================================
// Main API Function
// ============================================================

async function request(path, options = {}) {
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
    if (!response.ok && isCsrfFailure(response, text)) {
      clearCsrfToken();
      const freshToken = await fetchCsrfToken(true);

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
        "Unable to connect to the server. Please verify that the backend is running and accessible.",
        { cause: error }
      );
    }
    throw error;
  }
}

// ============================================================
// Convenience Methods
// ============================================================

export const get = (path, options = {}) =>
  api(path, { ...options, method: "GET" });

export const post = (path, options = {}) =>
  api(path, { ...options, method: "POST" });

export const put = (path, options = {}) =>
  api(path, { ...options, method: "PUT" });

export const patch = (path, options = {}) =>
  api(path, { ...options, method: "PATCH" });

export const del = (path, options = {}) =>
  api(path, { ...options, method: "DELETE" });

/** Build a query string, skipping empty values: qs({page: 1, q: ""}) -> "?page=1" */
export function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, v);
  });
  const out = p.toString();
  return out ? `?${out}` : "";
}

/** Multipart upload with progress (fetch has no upload progress, XHR does). */
export async function uploadWithProgress(path, formData, onProgress) {
  await fetchCsrfToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}${path}`);
    xhr.withCredentials = true;
    if (csrfToken) xhr.setRequestHeader("X-CSRFToken", csrfToken);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || "{}"); } catch { /* non-JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
      const err = new Error(data.error || data.detail || "Upload failed.");
      err.status = xhr.status;
      err.data = data;
      reject(err);
    };
    xhr.onerror = () => reject(new Error("Unable to connect to the server."));
    xhr.send(formData);
  });
}

// Identical GETs that are already in flight share one network request (React StrictMode double-effects,
// several components asking for the same resource, rapid navigation).
const inflight = new Map();

export function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET" || options.signal || options.headers) return request(path, options);
  const existing = inflight.get(path);
  if (existing) return existing;
  const promise = request(path, options).finally(() => inflight.delete(path));
  inflight.set(path, promise);
  return promise;
}
