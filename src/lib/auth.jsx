import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/auth/me/")
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      async refreshUser() {
        try {
          const data = await api("/auth/me/");
          setUser(data.user);
        } catch {
          // ignore
        }
      },
      async login(payload) {
        const data = await api("/auth/login/", { method: "POST", body: payload });
        setUser(data.user);
        return data.user;
      },
      async signup(payload) {
        const data = await api("/auth/signup/", { method: "POST", body: payload });
        setUser(data.user);
      },
      async logout() {
        await api("/auth/logout/", { method: "POST" });
        setUser(null);
      },
      async requestPasswordReset(payload) {
        return api("/auth/password-reset/", { method: "POST", body: payload });
      },
      async confirmPasswordReset(payload) {
        return api("/auth/password-reset/confirm/", { method: "POST", body: payload });
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
