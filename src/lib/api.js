// ============================================================
// api.js — Centralized API client with environment-based config
// ============================================================
// .env variables expected:
//   REACT_APP_API_URL=https://api.saed.dunistech.ng/api   (production)
//   REACT_APP_API_URL=http://127.0.0.1:8002/api            (development)
// ============================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";
const isDev = process.env.NODE_ENV === "development";

let csrfToken = "";

// ============================================================
// CSRF Token Management
// ============================================================
async function fetchCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(`${API_BASE_URL}/csrf/`, { credentials: "include" });
    if (!res.ok) return "";
    const data = await res.json();
    csrfToken = data.csrfToken || "";
    return csrfToken;
  } catch {
    return "";
  }
}

function clearCsrf() {
  csrfToken = "";
}

// ============================================================
// Request Builder
// ============================================================
function buildHeaders(options, method) {
  const headers = { ...(options.headers || {}) };
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    headers["X-CSRFToken"] = csrfToken;
  }

  return { headers, isFormData };
}

function buildBody(options, isFormData) {
  if (!options.body) return undefined;
  return isFormData ? options.body : JSON.stringify(options.body);
}

// ============================================================
// Response Handler
// ============================================================
async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function handleError(response, data, text) {
  const error = new Error(data.error || `Request failed with status ${response.status}.`);
  error.status = response.status;
  error.data = data;
  return error;
}

function isCsrfFailure(response, text) {
  return response.status === 403 && text.toLowerCase().includes("csrf");
}

// ============================================================
// Main API Function
// ============================================================
export async function api(path, options = {}) {
  const method = options.method || "GET";

  // Ensure CSRF for mutating requests
  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    await fetchCsrfToken();
  }

  const { headers, isFormData } = buildHeaders(options, method);
  const body = buildBody(options, isFormData);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      method,
      headers,
      body,
    });

    const text = await response.text();
    const data = await parseResponse(response);

    // Retry once on CSRF failure
    if (!response.ok && isCsrfFailure(response, text)) {
      clearCsrf();
      const newToken = await fetchCsrfToken();

      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        method,
        headers: { ...headers, "X-CSRFToken": newToken },
        body,
      });

      const retryText = await retryResponse.text();
      const retryData = await parseResponse(retryResponse);

      if (!retryResponse.ok) {
        throw handleError(retryResponse, retryData, retryText);
      }

      // Clear CSRF on auth state changes
      if (["/auth/login/", "/auth/signup/", "/auth/logout/"].includes(path)) {
        clearCsrf();
      }

      return retryData;
    }

    if (!response.ok) {
      throw handleError(response, data, text);
    }

    // Clear CSRF on auth state changes
    if (["/auth/login/", "/auth/signup/", "/auth/logout/"].includes(path)) {
      clearCsrf();
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Cannot connect to the SAED API. Make sure the backend server is running.");
    }
    throw err;
  }
}

// ============================================================
// Convenience Methods
// ============================================================
export const get = (path, options = {}) => api(path, { ...options, method: "GET" });
export const post = (path, options = {}) => api(path, { ...options, method: "POST" });
export const put = (path, options = {}) => api(path, { ...options, method: "PUT" });
export const patch = (path, options = {}) => api(path, { ...options, method: "PATCH" });
export const del = (path, options = {}) => api(path, { ...options, method: "DELETE" });

