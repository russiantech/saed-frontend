
// // v2
// // auth.jsx — v3
// // KEY FIX (this revision):
// // The initial session-hydration effect now also calls primeCsrfToken()
// // alongside /auth/me/, via Promise.all. This guarantees the CSRF cookie is
// // fetched and cached exactly once, at app startup, before any page renders
// // — so every subsequent POST across the app (login, signup, validate-signup,
// // etc.) has a fresh token available on its *first* attempt, instead of
// // depending on whichever call site happens to fire first. This is the fix
// // for the "some endpoints work, some don't" CSRF inconsistency.

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
// } from "react";
// import { api, onAuthError, suppressAuthErrors, primeCsrfToken } from "./api.js";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   // Tracks whether we've finished the initial /me/ check.
//   // Used to suppress spurious 401-triggered logouts during hydration.
//   const sessionReadyRef = useRef(false);

//   // ─── Initial session hydration ────────────────────────────────────────────
//   useEffect(() => {
//     let cancelled = false;

//     // Tell api.js to hold off on broadcasting auth errors until we're done.
//     suppressAuthErrors(true);

//     // Prime the CSRF cookie/token and hydrate the session in parallel. Both
//     // are needed before the app is usable: primeCsrfToken() ensures any
//     // POST made anywhere in the app has a valid token on its first try;
//     // /auth/me/ tells us who (if anyone) is logged in.
//     Promise.all([primeCsrfToken(), api("/auth/me/")])
//       .then(([, data]) => {
//         if (!cancelled) setUser(data?.user ?? null);
//       })
//       .catch(() => {
//         if (!cancelled) setUser(null);
//       })
//       .finally(() => {
//         if (!cancelled) {
//           setLoading(false);
//           sessionReadyRef.current = true;
//           // Now it's safe to let 401s trigger logout.
//           suppressAuthErrors(false);
//         }
//       });

//     return () => {
//       cancelled = true;
//       // If the component unmounts before hydration finishes (e.g. HMR),
//       // make sure we re-enable auth errors so nothing is permanently stuck.
//       suppressAuthErrors(false);
//     };
//   }, []);

//   // ─── Global 401 listener ──────────────────────────────────────────────────
//   // After hydration, any 401 means the session expired server-side.
//   // We clear local user state; the Router's protected-route guard handles redirect.
//   useEffect(() => {
//     const unsubscribe = onAuthError(() => {
//       // Guard: only act if hydration is complete and we actually had a user.
//       if (sessionReadyRef.current) {
//         setUser(null);
//       }
//     });
//     return unsubscribe;
//   }, []);

//   // ─── Auth actions ──────────────────────────────────────────────────────────
//   const refreshUser = useCallback(async () => {
//     try {
//       const data = await api("/auth/me/");
//       const userData = data?.user ?? null;
//       setUser(userData);
//       return userData;
//     } catch {
//       setUser(null);
//       return null;
//     }
//   }, []);

//   const login = useCallback(async (payload) => {
//     const data = await api("/auth/login/", { method: "POST", body: payload });
//     const userData = data?.user ?? null;
//     setUser(userData);
//     return userData;
//   }, []);

//   const signup = useCallback(async (payload) => {
//     const data = await api("/auth/signup/", { method: "POST", body: payload });
//     const userData = data?.user ?? null;
//     setUser(userData);
//     return userData;
//   }, []);

//   const trainerSignup = useCallback(async (payload) => {
//     const data = await api("/auth/trainer-signup/", { method: "POST", body: payload });
//     const userData = data?.user ?? null;
//     setUser(userData);
//     return userData;
//   }, []);

//   const logout = useCallback(async () => {
//     // Clear state immediately so the UI reflects logout without waiting for
//     // the network round-trip (which may itself 401 if session is already gone).
//     setUser(null);
//     try {
//       await api("/auth/logout/", { method: "POST" });
//     } catch {
//       // Ignore — session is gone either way.
//     }
//   }, []);

//   const requestPasswordReset = useCallback(async (payload) => {
//     return api("/auth/password-reset/", { method: "POST", body: payload });
//   }, []);

//   const confirmPasswordReset = useCallback(async (payload) => {
//     return api("/auth/password-reset/confirm/", { method: "POST", body: payload });
//   }, []);

//   const isAuthenticated = user !== null;

//   const value = {
//     user,
//     setUser,
//     loading,
//     isAuthenticated,
//     refreshUser,
//     login,
//     signup,
//     trainerSignup,
//     logout,
//     requestPasswordReset,
//     confirmPasswordReset,
//   };

//   if (loading) {
//     return (
//       <div className="auth-loading-screen">
//         <div className="loader-ring" />
//         <p className="loader-text">
//           Loading session
//           <span className="loader-dots">
//             <span /><span /><span />
//           </span>
//         </p>
//       </div>
//     );
//   }

//   return (
//     <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === null) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }



// // v2
// // auth.jsx — v4
// // KEY FIXES (this revision):
// // 1. Imports clearSessionCookies from api.js and calls it on logout and on
// //    initial-hydration failure, ensuring the browser never keeps a zombie
// //    sessionid after the server has discarded it.
// // 2. The global 401 listener now clears cookies before wiping user state,
// //    so a subsequent page refresh or login starts with a clean session.

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
// } from "react";
// import {
//   api,
//   onAuthError,
//   suppressAuthErrors,
//   primeCsrfToken,
//   clearSessionCookies,
// } from "./api.js";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const sessionReadyRef = useRef(false);

//   // ─── Initial session hydration ────────────────────────────────────────────
//   useEffect(() => {
//     let cancelled = false;

//     suppressAuthErrors(true);

//     Promise.all([primeCsrfToken(), api("/auth/me/")])
//       .then(([, data]) => {
//         if (!cancelled) setUser(data?.user ?? null);
//       })
//       .catch((err) => {
//         if (!cancelled) {
//           setUser(null);
//           // If /me/ failed because of auth (401/403), make sure we don't
//           // leave a dead sessionid in the browser.
//           if (err?.status === 401 || err?.status === 403) {
//             clearSessionCookies();
//           }
//         }
//       })
//       .finally(() => {
//         if (!cancelled) {
//           setLoading(false);
//           sessionReadyRef.current = true;
//           suppressAuthErrors(false);
//         }
//       });

//     return () => {
//       cancelled = true;
//       suppressAuthErrors(false);
//     };
//   }, []);

//   // ─── Global 401 listener ──────────────────────────────────────────────────
//   useEffect(() => {
//     const unsubscribe = onAuthError(() => {
//       if (sessionReadyRef.current) {
//         clearSessionCookies();
//         setUser(null);
//       }
//     });
//     return unsubscribe;
//   }, []);

//   // ─── Auth actions ──────────────────────────────────────────────────────────
//   const refreshUser = useCallback(async () => {
//     try {
//       const data = await api("/auth/me/");
//       const userData = data?.user ?? null;
//       setUser(userData);
//       return userData;
//     } catch {
//       setUser(null);
//       return null;
//     }
//   }, []);

//   const login = useCallback(async (payload) => {
//     const data = await api("/auth/login/", { method: "POST", body: payload });
//     const userData = data?.user ?? null;
//     setUser(userData);
//     return userData;
//   }, []);

//   const signup = useCallback(async (payload) => {
//     const data = await api("/auth/signup/", { method: "POST", body: payload });
//     const userData = data?.user ?? null;
//     setUser(userData);
//     return userData;
//   }, []);

//   const trainerSignup = useCallback(async (payload) => {
//     const data = await api("/auth/trainer-signup/", {
//       method: "POST",
//       body: payload,
//     });
//     const userData = data?.user ?? null;
//     setUser(userData);
//     return userData;
//   }, []);

//   const logout = useCallback(async () => {
//     // Wipe state immediately so UI updates without waiting for the network.
//     setUser(null);
//     clearSessionCookies();
//     try {
//       await api("/auth/logout/", { method: "POST" });
//     } catch {
//       // Ignore — session is gone either way.
//     }
//   }, []);

//   const requestPasswordReset = useCallback(async (payload) => {
//     return api("/auth/password-reset/", { method: "POST", body: payload });
//   }, []);

//   const confirmPasswordReset = useCallback(async (payload) => {
//     return api("/auth/password-reset/confirm/", { method: "POST", body: payload });
//   }, []);

//   const isAuthenticated = user !== null;

//   const value = {
//     user,
//     setUser,
//     loading,
//     isAuthenticated,
//     refreshUser,
//     login,
//     signup,
//     trainerSignup,
//     logout,
//     requestPasswordReset,
//     confirmPasswordReset,
//   };

//   if (loading) {
//     return (
//       <div className="auth-loading-screen">
//         <div className="loader-ring" />
//         <p className="loader-text">
//           Loading session
//           <span className="loader-dots">
//             <span />
//             <span />
//             <span />
//           </span>
//         </p>
//       </div>
//     );
//   }

//   return (
//     <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === null) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }






// v3
// auth.jsx — v5
// Cleaned up: removed clearSessionCookies import since api.js now handles
// stale-session recovery internally via /auth/clear-session/.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { api, onAuthError, suppressAuthErrors, primeCsrfToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionReadyRef = useRef(false);

  // ─── Initial session hydration ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    suppressAuthErrors(true);

    Promise.all([primeCsrfToken(), api("/auth/me/")])
      .then(([, data]) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          sessionReadyRef.current = true;
          suppressAuthErrors(false);
        }
      });

    return () => {
      cancelled = true;
      suppressAuthErrors(false);
    };
  }, []);

  // ─── Global 401 listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthError(() => {
      if (sessionReadyRef.current) {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // ─── Auth actions ──────────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const data = await api("/auth/me/");
      const userData = data?.user ?? null;
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (payload) => {
    const data = await api("/auth/login/", { method: "POST", body: payload });
    const userData = data?.user ?? null;
    setUser(userData);
    return userData;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await api("/auth/signup/", { method: "POST", body: payload });
    const userData = data?.user ?? null;
    setUser(userData);
    return userData;
  }, []);

  const trainerSignup = useCallback(async (payload) => {
    const data = await api("/auth/trainer-signup/", {
      method: "POST",
      body: payload,
    });
    const userData = data?.user ?? null;
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await api("/auth/logout/", { method: "POST" });
    } catch {
      // Ignore — session is gone either way.
    }
  }, []);

  const requestPasswordReset = useCallback(async (payload) => {
    return api("/auth/password-reset/", { method: "POST", body: payload });
  }, []);

  const confirmPasswordReset = useCallback(async (payload) => {
    return api("/auth/password-reset/confirm/", { method: "POST", body: payload });
  }, []);

  const isAuthenticated = user !== null;

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    refreshUser,
    login,
    signup,
    trainerSignup,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
  };

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="loader-ring" />
        <p className="loader-text">
          Loading session
          <span className="loader-dots">
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

