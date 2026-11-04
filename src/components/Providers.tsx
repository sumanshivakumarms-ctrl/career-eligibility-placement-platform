"use client";

/** Theme (dark/light), auth state and toast host, shared by the whole app. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import type { SessionUser, Profile } from "@/lib/types";

/* ---------------- Theme ---------------- */
type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

/* ---------------- Auth ---------------- */
type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  savedIds: number[];
  appliedIds: number[];
  profile: Partial<Profile> | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  toggleSaved: (driveId: number) => Promise<boolean | null>;
  markApplied: (driveId: number) => void;
};
const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  savedIds: [],
  appliedIds: [],
  profile: null,
  refresh: async () => {},
  logout: async () => {},
  toggleSaved: async () => null,
  markApplied: () => {},
});
export const useAuth = () => useContext(AuthCtx);

export default function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("cp_theme", next);
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user);
      setSavedIds(data.savedIds ?? []);
      setAppliedIds(data.appliedIds ?? []);
      setProfile(data.profile ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setSavedIds([]);
    setAppliedIds([]);
    setProfile(null);
  }, []);

  const toggleSaved = useCallback(async (driveId: number) => {
    const res = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driveId }),
    });
    if (!res.ok) return null;
    const { saved } = await res.json();
    setSavedIds((ids) => (saved ? [...ids, driveId] : ids.filter((i) => i !== driveId)));
    return saved as boolean;
  }, []);

  const markApplied = useCallback((id: number) => setAppliedIds((ids) => [...ids, id]), []);

  const themeValue = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  const authValue = useMemo(
    () => ({ user, loading, savedIds, appliedIds, profile, refresh, logout, toggleSaved, markApplied }),
    [user, loading, savedIds, appliedIds, profile, refresh, logout, toggleSaved, markApplied],
  );

  return (
    <ThemeCtx.Provider value={themeValue}>
      <AuthCtx.Provider value={authValue}>
        {children}
        <Toaster position="top-right" richColors closeButton theme={theme} />
      </AuthCtx.Provider>
    </ThemeCtx.Provider>
  );
}
