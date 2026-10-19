import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveSession = useCallback((data) => {
    localStorage.setItem("sehatsathi_token", data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const { data } = await api.post("/auth/login", credentials);
      saveSession(data);
      return data.user;
    },
    [saveSession]
  );

  const register = useCallback(
    async (details) => {
      const { data } = await api.post("/auth/register", details);
      saveSession(data);
      return data.user;
    },
    [saveSession]
  );
  const updateUser = useCallback((updatedUser) => {
  setUser((currentUser) =>
    currentUser ? { ...currentUser, ...updatedUser } : updatedUser
  );
}, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sehatsathi_token");
    localStorage.removeItem("sehatsathi_role");
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = localStorage.getItem("sehatsathi_token");

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (active) setUser(data.user);
      } catch {
        localStorage.removeItem("sehatsathi_token");
        localStorage.removeItem("sehatsathi_role");
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout,updateUser, isAuthenticated: Boolean(user) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}