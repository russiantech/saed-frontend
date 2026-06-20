// const configuredApiBase = process.env.REACT_APP_API_BASE_URL || "";
// const proxyApiBase = process.env.NODE_ENV === "development" ? "/api" : "";
// const browserHost = typeof window !== "undefined" ? window.location.hostname : "";
// const browserApiBases = browserHost
//   ? [`http://${browserHost}:8002/api`, `http://${browserHost}:8000/api`]
//   : [];
// const API_BASES = Array.from(
//   new Set(
//     [
//       proxyApiBase,
//       configuredApiBase,
//       ...browserApiBases,
//       "http://127.0.0.1:8002/api",
//       "http://localhost:8002/api",
//       "http://127.0.0.1:8000/api",
//       "http://localhost:8000/api",
//     ].filter(Boolean),
//   ),
// );

// let csrfToken = "";
// let activeApiBase = API_BASES[0];
// let lockedBase = null;

// async function ensureCsrf() {
//   if (csrfToken) return csrfToken;
//   try {
//     const response = await fetch(`${activeApiBase}/csrf/`, { credentials: "include" });
//     if (!response.ok) return "";
//     const data = await response.json();
//     csrfToken = data.csrfToken || "";
//     return csrfToken;
//   } catch {
//     return "";
//   }
// }

// export async function api(path, options = {}) {
//   const method = options.method || "GET";
//   let lastNetworkError = null;

//   const basesToTry = lockedBase ? [lockedBase] : API_BASES;

//   for (const base of basesToTry) {
//     if (activeApiBase !== base) {
//       csrfToken = "";
//     }
//     activeApiBase = base;
//     try {
//       for (let attempt = 0; attempt < 2; attempt += 1) {
//         const headers = { ...(options.headers || {}) };
//         const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
//         if (options.body && !isFormData && !headers["Content-Type"]) {
//           headers["Content-Type"] = "application/json";
//         }
//         if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
//           headers["X-CSRFToken"] = await ensureCsrf();
//         }

//         const response = await fetch(`${base}${path}`, {
//           credentials: "include",
//           ...options,
//           method,
//           headers,
//           body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
//         });

//         const text = await response.text();
//         let data = {};
//         try {
//           data = text ? JSON.parse(text) : {};
//         } catch {
//           data = {};
//         }

//         if (!response.ok) {
//           const csrfFailed = response.status === 403 && text.toLowerCase().includes("csrf");
//           if (csrfFailed && attempt === 0) {
//             csrfToken = "";
//             continue;
//           }

//           const error = new Error(data.error || `Request failed with status ${response.status}.`);
//           error.status = response.status;
//           error.data = data;
//           throw error;
//         }

//         activeApiBase = base;
//         lockedBase = base;
//         if (["/auth/login/", "/auth/signup/", "/auth/logout/"].includes(path)) {
//           csrfToken = "";
//         }
//         return data;
//       }
//     } catch (err) {
//       if (err instanceof TypeError) {
//         csrfToken = "";
//         lastNetworkError = err;
//         if (!lockedBase) continue;
//         lockedBase = null;
//         continue;
//       }
//       throw err;
//     }
//   }

//   throw new Error(lastNetworkError ? "Cannot connect to the SAED API. Make sure the backend server is running." : "Request failed.");
// }



// v2
const configuredApiBase = process.env.REACT_APP_API_BASE_URL || "";
const isDev = process.env.NODE_ENV === "development";
const proxyApiBase = isDev ? "/api" : "";
const browserHost = typeof window !== "undefined" ? window.location.hostname : "";
const browserApiBases = browserHost && !isDev
  ? [`http://${browserHost}:8002/api`, `http://${browserHost}:8000/api`]
  : [];
const API_BASES = Array.from(
  new Set(
    [
      proxyApiBase,
      configuredApiBase,
      ...browserApiBases,
      "http://127.0.0.1:8002/api",
      "http://localhost:8002/api",
      "http://127.0.0.1:8000/api",
      "http://localhost:8000/api",
    ].filter(Boolean),
  ),
);

let csrfToken = "";
let activeApiBase = API_BASES[0];
let lockedBase = null;

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  try {
    const response = await fetch(`${activeApiBase}/csrf/`, { credentials: "include" });
    if (!response.ok) return "";
    const data = await response.json();
    csrfToken = data.csrfToken || "";
    return csrfToken;
  } catch {
    return "";
  }
}

export async function api(path, options = {}) {
  const method = options.method || "GET";
  let lastNetworkError = null;

  const basesToTry = lockedBase ? [lockedBase] : API_BASES;

  for (const base of basesToTry) {
    if (activeApiBase !== base) {
      csrfToken = "";
    }
    activeApiBase = base;
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const headers = { ...(options.headers || {}) };
        const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
        if (options.body && !isFormData && !headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }
        if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
          headers["X-CSRFToken"] = await ensureCsrf();
        }

        const response = await fetch(`${base}${path}`, {
          credentials: "include",
          ...options,
          method,
          headers,
          body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
        });

        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (!response.ok) {
          const csrfFailed = response.status === 403 && text.toLowerCase().includes("csrf");
          if (csrfFailed && attempt === 0) {
            csrfToken = "";
            continue;
          }

          const error = new Error(data.error || `Request failed with status ${response.status}.`);
          error.status = response.status;
          error.data = data;
          throw error;
        }

        activeApiBase = base;
        lockedBase = base;
        if (["/auth/login/", "/auth/signup/", "/auth/logout/"].includes(path)) {
          csrfToken = "";
        }
        return data;
      }
    } catch (err) {
      if (err instanceof TypeError) {
        csrfToken = "";
        lastNetworkError = err;
        if (!lockedBase) continue;
        lockedBase = null;
        continue;
      }
      throw err;
    }
  }

  throw new Error(lastNetworkError ? "Cannot connect to the SAED API. Make sure the backend server is running." : "Request failed.");
}
