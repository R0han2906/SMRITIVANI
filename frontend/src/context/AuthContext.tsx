import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as api from "../services/api";

type AuthContextValue = {
  user: Record<string, unknown> | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<Record<string, unknown>>;
  signup: (data: { email: string; password: string; display_name: string; account_type: "caregiver"; phone?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: { display_name?: string; phone?: string; city?: string }) => Promise<Record<string, unknown>>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => api.getStoredToken());
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      const storedToken = api.getStoredToken();
      if (!storedToken) { setIsLoading(false); return; }
      try {
        const profile = await api.getCurrentUser();
        if (active) { setToken(storedToken); setUser(profile); }
      } catch (error) {
        const refreshToken = api.getStoredRefreshToken();
        if (error instanceof api.ApiError && error.status === 401 && refreshToken) {
          try {
            const session = await api.refresh(refreshToken);
            if (!session.access_token) throw new Error("Session refresh did not return an access token.");
            api.saveSession(session);
            const profile = await api.getCurrentUser();
            if (active) { setToken(session.access_token); setUser(profile); }
          } catch { api.clearSession(); if (active) { setToken(null); setUser(null); } }
        } else { api.clearSession(); if (active) { setToken(null); setUser(null); } }
      } finally { if (active) setIsLoading(false); }
    }
    void restoreSession();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const session = await api.login(credentials);
    if (!session.access_token) throw new Error("The backend did not return an access token.");
    api.saveSession(session);
    const profile = await api.getCurrentUser();
    api.unlockCaregiverInterface();
    // Clear any stale device pairing data from prior patient sessions
    api.disablePatientDevice();
    setToken(session.access_token); setUser(profile);
    return profile;
  }, []);

  const signup = useCallback(async (data: { email: string; password: string; display_name: string; account_type: "caregiver"; phone?: string }) => {
    const { phone, ...signupData } = data;
    const result = await api.signup(signupData);
    if (!result.access_token) return false;
    api.saveSession(result);
    let profile: Record<string, unknown>;
    try {
      profile = await api.getCurrentUser();
      if (phone?.trim()) profile = await api.updateCurrentUser({ phone: phone.trim() });
    }
    catch { profile = (result.user as Record<string, unknown> | undefined) ?? { display_name: data.display_name, email: data.email, account_type: data.account_type }; }
    api.unlockCaregiverInterface();
    // Clear any stale device pairing data
    api.disablePatientDevice();
    setToken(result.access_token); setUser(profile);
    return true;
  }, []);

  const logout = useCallback(async () => {
    try { if (api.getStoredToken()) await api.logout(); }
    finally { api.clearSession(); setToken(null); setUser(null); }
  }, []);

  const updateProfile = useCallback(async (data: { display_name?: string; phone?: string; city?: string }) => {
    const updated = await api.updateCurrentUser(data);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(() => ({ user, token, isAuthenticated: Boolean(token), isLoading, login, signup, logout, updateProfile }), [user, token, isLoading, login, signup, logout, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
