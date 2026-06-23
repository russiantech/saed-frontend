// api.js — Centralized API Client
// Environment Variables:
//   REACT_APP_API_URL - Backend API URL (default: "/api" for proxy)

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

let csrfToken = "";

// ============================================================
// Auth-error broadcast
// ============================================================

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

async function fetchCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

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
  }
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
  let message =
    data?.error ||
    data?.detail ||
    data?.message;

  if (!message) {
    switch (response.status) {
      case 400: message = "Invalid request."; break;
      case 401: message = "Authentication required."; break;
      case 403: message = "Permission denied."; break;
      case 404: message = "API endpoint not found."; break;
      case 500: message = "Internal server error."; break;
      default:  message = `Request failed with status ${response.status}.`;
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

function isAuthPath(path) {
  return ["/auth/login/", "/auth/signup/", "/auth/logout/"].includes(path);
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
      throw createApiError(response, data, text);
    }

    // ── Reset CSRF Cache After Auth Operations ────────────────
    if (isAuthPath(path)) {
      clearCsrfToken();
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
