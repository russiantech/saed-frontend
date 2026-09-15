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
    await api("/auth/login/", { method: "POST", body: payload });

    // A successful login response is not sufficient on its own: the browser
    // may reject or drop the session cookie. Confirm it immediately before
    // allowing protected pages to make requests with an unauthenticated
    // session.
    const session = await api("/auth/me/");
    const confirmedUser = session?.user ?? null;
    if (!confirmedUser) {
      throw new Error(
        "Your sign-in session could not be established. Please check that cookies are enabled and try again."
      );
    }

    setUser(confirmedUser);
    return confirmedUser;
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
    return api("/auth/forgot-password/", { method: "POST", body: payload });
  }, []);

  const confirmPasswordReset = useCallback(async (payload) => {
    return api("/auth/reset-password/", { method: "POST", body: payload });
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

