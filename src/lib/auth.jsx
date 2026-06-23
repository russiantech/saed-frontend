// // auth.jsx — v3
// // KEY FIXES:
// // 1. Introduces a `sessionReady` flag. onAuthError handlers in api.js are
// //    suppressed until the initial /auth/me/ check completes. This prevents
// //    dashboard/notifications 401s (which fire before the session is confirmed)
// //    from triggering logout() and destroying a valid Django session.
// // 2. logout() is now synchronous-safe: it sets user to null before the network
// //    call so the UI updates immediately, and won't double-fire.
// // 3. All callbacks are stable (useCallback with correct deps).

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
// } from "react";
// import { api, onAuthError, suppressAuthErrors } from "./api.js";

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

//     api("/auth/me/")
//       .then((data) => {
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
//     logout,
//     requestPasswordReset,
//     confirmPasswordReset,
//   };

//   if (loading) {
//     return (
//       <div className="auth-loading-screen">
//         <div className="spinner" />
//         <p>Loading session…</p>
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




// 2nd
// auth.jsx — v3
// KEY FIXES:
// 1. Introduces a `sessionReady` flag. onAuthError handlers in api.js are
//    suppressed until the initial /auth/me/ check completes. This prevents
//    dashboard/notifications 401s (which fire before the session is confirmed)
//    from triggering logout() and destroying a valid Django session.
// 2. logout() is now synchronous-safe: it sets user to null before the network
//    call so the UI updates immediately, and won't double-fire.
// 3. All callbacks are stable (useCallback with correct deps).

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { api, onAuthError, suppressAuthErrors } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tracks whether we've finished the initial /me/ check.
  // Used to suppress spurious 401-triggered logouts during hydration.
  const sessionReadyRef = useRef(false);

  // ─── Initial session hydration ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Tell api.js to hold off on broadcasting auth errors until we're done.
    suppressAuthErrors(true);

    api("/auth/me/")
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          sessionReadyRef.current = true;
          // Now it's safe to let 401s trigger logout.
          suppressAuthErrors(false);
        }
      });

    return () => {
      cancelled = true;
      // If the component unmounts before hydration finishes (e.g. HMR),
      // make sure we re-enable auth errors so nothing is permanently stuck.
      suppressAuthErrors(false);
    };
  }, []);

  // ─── Global 401 listener ──────────────────────────────────────────────────
  // After hydration, any 401 means the session expired server-side.
  // We clear local user state; the Router's protected-route guard handles redirect.
  useEffect(() => {
    const unsubscribe = onAuthError(() => {
      // Guard: only act if hydration is complete and we actually had a user.
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

  const logout = useCallback(async () => {
    // Clear state immediately so the UI reflects logout without waiting for
    // the network round-trip (which may itself 401 if session is already gone).
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
    logout,
    requestPasswordReset,
    confirmPasswordReset,
  };

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner" />
        <p>Loading session…</p>
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

