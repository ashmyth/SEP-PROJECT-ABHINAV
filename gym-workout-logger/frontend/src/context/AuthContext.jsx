import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, register as apiRegister, logout as apiLogout } from "../services/authService";
import { getStoredUser, clearStoredAuth } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    clearStoredAuth();
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [handleUnauthorized]);

  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      try {
        const u = await apiLogin(credentials);
        setUser(u);
        return u;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const u = await apiRegister(payload);
        setUser(u);
        return u;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    clearStoredAuth();
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
