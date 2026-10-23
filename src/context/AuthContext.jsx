import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../data/products";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const payload = await response.json();
      setUser(payload?.user ?? null);
      return payload?.user ?? null;
    } catch (error) {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      setLoading(true);
      const currentUser = await refreshUser();
      if (!cancelled && currentUser === null && user !== null) {
        setUser(null);
      }
      if (!cancelled) setLoading(false);
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const payload = await response.json().catch(() => ({ success: false, message: "Unable to sign in." }));

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || "Unable to sign in.");
    }

    setUser(payload.user ?? null);
    return payload;
  };

  const register = async (fullName, email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    const payload = await response.json().catch(() => ({ success: false, message: "Unable to create account." }));

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || "Unable to create account.");
    }

    setUser(payload.user ?? null);
    return payload;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: Boolean(user),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
