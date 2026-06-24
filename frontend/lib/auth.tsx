"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, clearToken, ApiClientError } from "./api";
import type { User } from "./types";
import { track } from "./analytics";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: "parent" | "student" | "university";
  universityName?: string;
  parentEmail?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("eduremit_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
      setToken(data.token);
      setUser(data.user);
      track("user_logged_in", { role: data.user.role });
      router.push(`/${data.user.role}`);
    },
    [router]
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      const data = await api.post<{ token: string; user: User }>("/auth/signup", payload);
      setToken(data.token);
      setUser(data.user);
      track("wallet_connected", { role: data.user.role });
      track("signup_completed", { role: data.user.role });
      router.push(`/${data.user.role}`);
    },
    [router]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiClientError };
