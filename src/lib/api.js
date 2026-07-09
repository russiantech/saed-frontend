// // ============================================================
// // api.js — Centralized API client with environment-based config
// // ============================================================
// // .env variables expected:
// //   REACT_APP_API_URL=https://api.saed.dunistech.ng/api   (production)
// //   REACT_APP_API_URL=http://127.0.0.1:8002/api            (development)
// // ============================================================

// const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";
// const isDev = process.env.NODE_ENV === "development";

// let csrfToken = "";

// // ============================================================
// // CSRF Token Management
// // ============================================================
// async function fetchCsrfToken() {
//   if (csrfToken) return csrfToken;
//   try {
//     const res = await fetch(`${API_BASE_URL}/csrf/`, { credentials: "include" });
//     if (!res.ok) return "";
//     const data = await res.json();
//     csrfToken = data.csrfToken || "";
//     return csrfToken;
//   } catch {
//     return "";
//   }
// }

// function clearCsrf() {
//   csrfToken = "";
// }

// // ============================================================
// // Request Builder
// // ============================================================
// function buildHeaders(options, method) {
//   const headers = { ...(options.headers || {}) };
//   const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

//   if (options.body && !isFormData && !headers["Content-Type"]) {
//     headers["Content-Type"] = "application/json";
//   }

//   if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
//     headers["X-CSRFToken"] = csrfToken;
//   }

//   return { headers, isFormData };
// }

// function buildBody(options, isFormData) {
//   if (!options.body) return undefined;
//   return isFormData ? options.body : JSON.stringify(options.body);
// }

// // ============================================================
// // Response Handler
// // ============================================================
// // async function parseResponse(response) {
// //   const text = await response.text();
// //   try {
// //     return text ? JSON.parse(text) : {};
// //   } catch {
// //     return {};
// //   }
// // }

// async function parseResponse(response) {
//   const text = await response.text();
//   try {
//     return text ? JSON.parse(text) : {};
//   } catch {
//     // Return raw text as error message if not valid JSON
//     return { error: text || "Invalid response from server", _raw: text };
//   }
// }

// // function handleError(response, data, text) {
// //   const error = new Error(data.error || `Request failed with status ${response.status}.`);
// //   error.status = response.status;
// //   error.data = data;
// //   return error;
// // }

// function handleError(response, data, text) {
//   const message = data?.error || data?.detail || text || `HTTP ${response.status}`;
//   const error = new Error(message);
//   error.status = response.status;
//   error.data = data;
//   error.raw = text;
//   return error;
// }

// function isCsrfFailure(response, text) {
//   return response.status === 403 && text.toLowerCase().includes("csrf");
// }

// // ============================================================
// // Main API Function
// // ============================================================
// export async function api(path, options = {}) {
//   const method = options.method || "GET";

//   // Ensure CSRF for mutating requests
//   if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
//     await fetchCsrfToken();
//   }

//   const { headers, isFormData } = buildHeaders(options, method);
//   const body = buildBody(options, isFormData);

//   try {
//     const response = await fetch(`${API_BASE_URL}${path}`, {
//       credentials: "include",
//       method,
//       headers,
//       body,
//     });

//     const text = await response.text();
//     const data = await parseResponse(response);

//     // Retry once on CSRF failure
//     if (!response.ok && isCsrfFailure(response, text)) {
//       clearCsrf();
//       const newToken = await fetchCsrfToken();

//       const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
//         credentials: "include",
//         method,
//         headers: { ...headers, "X-CSRFToken": newToken },
//         body,
//       });

//       const retryText = await retryResponse.text();
//       const retryData = await parseResponse(retryResponse);

//       if (!retryResponse.ok) {
//         throw handleError(retryResponse, retryData, retryText);
//       }

//       // Clear CSRF on auth state changes
//       if (["/auth/login/", "/auth/signup/", "/auth/logout/"].includes(path)) {
//         clearCsrf();
//       }

//       return retryData;
//     }

//     if (!response.ok) {
//       throw handleError(response, data, text);
//     }

//     // Clear CSRF on auth state changes
//     if (["/auth/login/", "/auth/signup/", "/auth/logout/"].includes(path)) {
//       clearCsrf();
//     }

//     return data;
//   } catch (err) {
//     if (err instanceof TypeError) {
//       console.log(`Request Error from api.js:  ${err}`);
//       throw new Error("Cannot connect to the SAED API. Make sure the backend server is running.");
//     }
//     throw err;
//   }
// }

// // ============================================================
// // Convenience Methods
// // ============================================================
// export const get = (path, options = {}) => api(path, { ...options, method: "GET" });
// export const post = (path, options = {}) => api(path, { ...options, method: "POST" });
// export const put = (path, options = {}) => api(path, { ...options, method: "PUT" });
// export const patch = (path, options = {}) => api(path, { ...options, method: "PATCH" });
// export const del = (path, options = {}) => api(path, { ...options, method: "DELETE" });





// // v2
// // ============================================================
// // api.js — Centralized API Client
// // ============================================================
// // Environment Variables:
// //
// // Development:
// // REACT_APP_API_URL=http://127.0.0.1:8002/api
// //
// // Production:
// // REACT_APP_API_URL=https://api.saed.dunistech.ng/api
// // ============================================================

// const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

// let csrfToken = "";

// // ============================================================
// // CSRF Token Management
// // ============================================================

// async function fetchCsrfToken() {
//   if (csrfToken) {
//     return csrfToken;
//   }

//   try {
//     const response = await fetch(`${API_BASE_URL}/csrf/`, {
//       credentials: "include",
//     });

//     if (!response.ok) {
//       return "";
//     }

//     const data = await response.json();
//     csrfToken = data?.csrfToken || "";

//     return csrfToken;
//   } catch {
//     return "";
//   }
// }

// function clearCsrfToken() {
//   csrfToken = "";
// }

// // ============================================================
// // Request Helpers
// // ============================================================

// function isSafeMethod(method) {
//   return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
// }

// function buildHeaders(options = {}, method = "GET") {
//   const headers = { ...(options.headers || {}) };

//   const isFormData =
//     typeof FormData !== "undefined" &&
//     options.body instanceof FormData;

//   if (
//     options.body &&
//     !isFormData &&
//     !headers["Content-Type"]
//   ) {
//     headers["Content-Type"] = "application/json";
//   }

//   if (!isSafeMethod(method) && csrfToken) {
//     headers["X-CSRFToken"] = csrfToken;
//   }

//   return {
//     headers,
//     isFormData,
//   };
// }

// function buildBody(options = {}, isFormData = false) {
//   if (options.body == null) {
//     return undefined;
//   }

//   return isFormData
//     ? options.body
//     : JSON.stringify(options.body);
// }

// // ============================================================
// // Response Parsing
// // ============================================================
// /*
// async function parseResponse(response) {
//   const text = await response.text();

//   let data = {};

//   if (text) {
//     try {
//       data = JSON.parse(text);
//     } catch {
//       data = {
//         message: text,
//         raw: text,
//       };
//     }
//   }

//   return {
//     data,
//     text,
//   };
// }
// */
// // v2
// async function parseResponse(response) {
//   const text = await response.text();

//   if (!text) {
//     return {
//       data: {},
//       text: "",
//     };
//   }

//   try {
//     return {
//       data: JSON.parse(text),
//       text,
//     };
//   } catch {
//     const isHtml =
//       text.trim().startsWith("<!DOCTYPE html") ||
//       text.trim().startsWith("<html");

//     return {
//       data: isHtml
//         ? {
//             error: response.status === 404
//               ? "API endpoint not found."
//               : "Server returned an unexpected HTML response.",
//           }
//         : {
//             message: text,
//           },
//       text,
//     };
//   }
// }


// // ============================================================
// // Error Handling
// // ============================================================
// const authErrorHandlers = new Set();

// export function onAuthError(handler) {
//   authErrorHandlers.add(handler);
//   return () => authErrorHandlers.delete(handler);
// }


// /*
// function createApiError(response, data, text) {
//   const message =
//     data?.error ||
//     data?.detail ||
//     data?.message ||
//     text ||
//     `Request failed with status ${response.status}`;

//   const error = new Error(message);

//   error.status = response.status;
//   error.data = data;
//   error.raw = text;

//   return error;
// }
// */
// // v2
// function createApiError(response, data, text) {
//   let message =
//     data?.error ||
//     data?.detail ||
//     data?.message;

//   if (!message) {
//     switch (response.status) {
//       case 400:
//         message = "Invalid request.";
//         break;

//       case 401:
//         message = "Authentication required.";
//         break;

//       case 403:
//         message = "Permission denied.";
//         break;

//       case 404:
//         message = "API endpoint not found.";
//         break;

//       case 500:
//         message = "Internal server error.";
//         break;

//       default:
//         message = `Request failed with status ${response.status}.`;
//     }
//   }

//   const error = new Error(message);

//   error.status = response.status;
//   error.data = data;
//   error.raw = text;

//   // return error;
//   // const error = new Error(message);
//   error.status = response.status;
//   error.data = data;
//   error.raw = text;

//   if (response.status === 401) {
//     authErrorHandlers.forEach((h) => h());
//   }

//   return error;
// }

// function isCsrfFailure(response, text = "") {
//   return (
//     response.status === 403 &&
//     text.toLowerCase().includes("csrf")
//   );
// }

// function isAuthPath(path) {
//   return [
//     "/auth/login/",
//     "/auth/signup/",
//     "/auth/logout/",
//   ].includes(path);
// }

// // ============================================================
// // Main API Function
// // ============================================================

// export async function api(path, options = {}) {
//   const method = options.method || "GET";

//   if (!isSafeMethod(method)) {
//     await fetchCsrfToken();
//   }

//   const { headers, isFormData } = buildHeaders(
//     options,
//     method
//   );

//   const body = buildBody(options, isFormData);

//   try {
//     let response = await fetch(`${API_BASE_URL}${path}`, {
//       method,
//       credentials: "include",
//       headers,
//       body,
//     });

//     let { data, text } = await parseResponse(response);

//     // ========================================================
//     // Automatic CSRF Retry
//     // ========================================================

//     if (!response.ok && isCsrfFailure(response, text)) {
//       clearCsrfToken();

//       const freshToken = await fetchCsrfToken();

//       response = await fetch(`${API_BASE_URL}${path}`, {
//         method,
//         credentials: "include",
//         headers: {
//           ...headers,
//           "X-CSRFToken": freshToken,
//         },
//         body,
//       });

//       ({ data, text } = await parseResponse(response));
//     }

//     // ========================================================
//     // Handle API Errors
//     // ========================================================

//     if (!response.ok) {
//       throw createApiError(response, data, text);
//     }

//     // ========================================================
//     // Reset CSRF Cache After Auth Operations
//     // ========================================================

//     if (isAuthPath(path)) {
//       clearCsrfToken();
//     }

//     return data;
//   } catch (error) {
//     if (error instanceof TypeError) {
//       console.error("API Network Error:", error);

//       throw new Error(
//         "Unable to connect to the server. Please verify that the backend is running and accessible."
//       );
//     }

//     throw error;
//   }
// }

// // ============================================================
// // Convenience Methods
// // ============================================================

// export const get = (path, options = {}) =>
//   api(path, {
//     ...options,
//     method: "GET",
//   });

// export const post = (path, options = {}) =>
//   api(path, {
//     ...options,
//     method: "POST",
//   });

// export const put = (path, options = {}) =>
//   api(path, {
//     ...options,
//     method: "PUT",
//   });

// export const patch = (path, options = {}) =>
//   api(path, {
//     ...options,
//     method: "PATCH",
//   });

// export const del = (path, options = {}) =>
//   api(path, {
//     ...options,
//     method: "DELETE",
//   });





// // v3
// // api.js — v3
// // KEY FIXES:
// // 1. Adds suppressAuthErrors(bool) so auth.jsx can mute 401 broadcasts during
// //    the initial /me/ hydration window, preventing the redirect loop.
// // 2. Removes the duplicate `error.status = response.status` assignment that
// //    existed in createApiError (copy-paste artifact from v2).
// // 3. No other behavioural changes — CSRF, retry, convenience methods unchanged.

// // ============================================================
// // Environment Variables:
// //
// // Development:
// // REACT_APP_API_URL=http://127.0.0.1:8002/api
// //
// // Production:
// // REACT_APP_API_URL=https://api.saed.dunistech.ng/api
// // ============================================================

// const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

// let csrfToken = "";

// // ============================================================
// // Auth-error broadcast
// // ============================================================

// const authErrorHandlers = new Set();
// // When true, 401s are recorded but not broadcast. Set to true during the
// // initial session-check so transient 401s don't trigger logout.
// let authErrorsSuppressed = false;

// export function suppressAuthErrors(suppress) {
//   authErrorsSuppressed = suppress;
// }

// export function onAuthError(handler) {
//   authErrorHandlers.add(handler);
//   return () => authErrorHandlers.delete(handler);
// }

// // ============================================================
// // CSRF Token Management
// // ============================================================

// async function fetchCsrfToken() {
//   if (csrfToken) {
//     return csrfToken;
//   }

//   try {
//     const response = await fetch(`${API_BASE_URL}/csrf/`, {
//       credentials: "include",
//     });

//     if (!response.ok) {
//       return "";
//     }

//     const data = await response.json();
//     csrfToken = data?.csrfToken || "";
//     return csrfToken;
//   } catch {
//     return "";
//   }
// }

// function clearCsrfToken() {
//   csrfToken = "";
// }

// // ============================================================
// // Request Helpers
// // ============================================================

// function isSafeMethod(method) {
//   return ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
// }

// function buildHeaders(options = {}, method = "GET") {
//   const headers = { ...(options.headers || {}) };

//   const isFormData =
//     typeof FormData !== "undefined" && options.body instanceof FormData;

//   if (options.body && !isFormData && !headers["Content-Type"]) {
//     headers["Content-Type"] = "application/json";
//   }

//   if (!isSafeMethod(method) && csrfToken) {
//     headers["X-CSRFToken"] = csrfToken;
//   }

//   return { headers, isFormData };
// }

// function buildBody(options = {}, isFormData = false) {
//   if (options.body == null) {
//     return undefined;
//   }
//   return isFormData ? options.body : JSON.stringify(options.body);
// }

// // ============================================================
// // Response Parsing
// // ============================================================

// async function parseResponse(response) {
//   const text = await response.text();

//   if (!text) {
//     return { data: {}, text: "" };
//   }

//   try {
//     return { data: JSON.parse(text), text };
//   } catch {
//     const isHtml =
//       text.trim().startsWith("<!DOCTYPE html") ||
//       text.trim().startsWith("<html");

//     return {
//       data: isHtml
//         ? {
//             error:
//               response.status === 404
//                 ? "API endpoint not found."
//                 : "Server returned an unexpected HTML response.",
//           }
//         : { message: text },
//       text,
//     };
//   }
// }

// // ============================================================
// // Error Handling
// // ============================================================

// let suppressAuthErrorsFlag = false;

// export function suppressAuthErrors(suppress) {
//   suppressAuthErrorsFlag = suppress;
// }

// /*
// function createApiError(response, data, text) {
//   let message = data?.error || data?.detail || data?.message;

//   if (!message) {
//     switch (response.status) {
//       case 400:
//         message = "Invalid request.";
//         break;
//       case 401:
//         message = "Authentication required.";
//         break;
//       case 403:
//         message = "Permission denied.";
//         break;
//       case 404:
//         message = "API endpoint not found.";
//         break;
//       case 500:
//         message = "Internal server error.";
//         break;
//       default:
//         message = `Request failed with status ${response.status}.`;
//     }
//   }

//   const error = new Error(message);
//   error.status = response.status;
//   error.data = data;
//   error.raw = text;

//   if (response.status === 401 && !authErrorsSuppressed) {
//     authErrorHandlers.forEach((h) => h());
//   }

//   return error;
// }
// */
// function createApiError(response, data, text) {
//   let message =
//     data?.error ||
//     data?.detail ||
//     data?.message;

//   if (!message) {
//     switch (response.status) {
//       case 400: message = "Invalid request."; break;
//       case 401: message = "Authentication required."; break;
//       case 403: message = "Permission denied."; break;
//       case 404: message = "API endpoint not found."; break;
//       case 500: message = "Internal server error."; break;
//       default:  message = `Request failed with status ${response.status}.`;
//     }
//   }

//   const error = new Error(message);
//   error.status = response.status;
//   error.data = data;
//   error.raw = text;

//   if (response.status === 401 && !suppressAuthErrorsFlag) {
//     authErrorHandlers.forEach((h) => h());
//   }

//   return error;
// }

// function isCsrfFailure(response, text = "") {
//   return response.status === 403 && text.toLowerCase().includes("csrf");
// }

// function isAuthPath(path) {
//   return ["/auth/login/", "/auth/signup/", "/auth/logout/"].includes(path);
// }

// // ============================================================
// // Main API Function
// // ============================================================

// export async function api(path, options = {}) {
//   const method = options.method || "GET";

//   if (!isSafeMethod(method)) {
//     await fetchCsrfToken();
//   }

//   const { headers, isFormData } = buildHeaders(options, method);
//   const body = buildBody(options, isFormData);

//   try {
//     let response = await fetch(`${API_BASE_URL}${path}`, {
//       method,
//       credentials: "include",
//       headers,
//       body,
//     });

//     let { data, text } = await parseResponse(response);

//     // ── Automatic CSRF Retry ──────────────────────────────────
//     if (!response.ok && isCsrfFailure(response, text)) {
//       clearCsrfToken();
//       const freshToken = await fetchCsrfToken();

//       response = await fetch(`${API_BASE_URL}${path}`, {
//         method,
//         credentials: "include",
//         headers: { ...headers, "X-CSRFToken": freshToken },
//         body,
//       });

//       ({ data, text } = await parseResponse(response));
//     }

//     // ── Handle API Errors ─────────────────────────────────────
//     if (!response.ok) {
//       throw createApiError(response, data, text);
//     }

//     // ── Reset CSRF Cache After Auth Operations ────────────────
//     if (isAuthPath(path)) {
//       clearCsrfToken();
//     }

//     return data;
//   } catch (error) {
//     if (error instanceof TypeError) {
//       console.error("API Network Error:", error);
//       throw new Error(
//         "Unable to connect to the server. Please verify that the backend is running and accessible."
//       );
//     }
//     throw error;
//   }
// }

// // ============================================================
// // Convenience Methods
// // ============================================================

// export const get = (path, options = {}) =>
//   api(path, { ...options, method: "GET" });

// export const post = (path, options = {}) =>
//   api(path, { ...options, method: "POST" });

// export const put = (path, options = {}) =>
//   api(path, { ...options, method: "PUT" });

// export const patch = (path, options = {}) =>
//   api(path, { ...options, method: "PATCH" });

// export const del = (path, options = {}) =>
//   api(path, { ...options, method: "DELETE" });








// api.js — v3
// KEY FIXES:
// 1. Adds suppressAuthErrors(bool) so auth.jsx can mute 401 broadcasts during
//    the initial /me/ hydration window, preventing the redirect loop.
// 2. Removes the duplicate `error.status = response.status` assignment that
//    existed in createApiError (copy-paste artifact from v2).
// 3. No other behavioural changes — CSRF, retry, convenience methods unchanged.

// ============================================================
// Environment Variables:
//
// Development:
// REACT_APP_API_URL=http://127.0.0.1:8002/api
//
// Production:
// REACT_APP_API_URL=https://api.saed.dunistech.ng/api
// ============================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

let csrfToken = "";

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

