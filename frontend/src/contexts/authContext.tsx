// frontend/src/contexts/authContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import {
  clearAuth,
  getRole,
  getUser,
  setRole,
  setToken,
  setUser,
} from "@/services/auth";

export type AuthUser = {
  id?: string;
  email?: string;
  nome?: string;
  role?: string; // "ADMIN", etc
  perfil?: string;
  [key: string]: any;
};

export type AuthContextValue = {
  user: AuthUser | null;
  role: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  setSession: (nextUser: AuthUser | null, nextRole?: string) => void; // útil se precisar
};

const AuthContext = createContext<AuthContextValue | null>(null);

function extractToken(data: any): string {
  return data?.token || data?.accessToken || data?.authToken || data?.jwt || "";
}

function extractRole(data: any): string {
  const role =
    data?.role ||
    data?.perfil ||
    data?.user?.role ||
    data?.user?.perfil ||
    "";

  return String(role || "");
}

function extractUser(data: any): AuthUser | null {
  if (data?.user && typeof data.user === "object") return data.user as AuthUser;
  // alguns backends retornam o usuário direto no payload
  if (data?.id || data?.email) return data as AuthUser;
  return null;
}

function loginPathFromBaseURL(): string {
  const base = String(api.defaults.baseURL || "");
  // se base já termina com /api => usa /auth/login
  if (base.replace(/\/$/, "").endsWith("/api")) return "/auth/login";
  // senão => usa /api/auth/login
  return "/api/auth/login";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  // ✅ estado em memória (pra TS e pra UI reagir)
  const [userState, setUserState] = useState<AuthUser | null>(null);
  const [roleState, setRoleState] = useState<string>("");

  // ✅ hidrata do localStorage (refresh não “zera”)
  useEffect(() => {
    const u = getUser<AuthUser>();
    const r = getRole();
    setUserState(u ?? null);
    setRoleState(r ?? "");
  }, []);

  function setSession(nextUser: AuthUser | null, nextRole?: string) {
    setUserState(nextUser);
    if (typeof nextRole === "string") setRoleState(nextRole);
  }

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const res = await api.post(loginPathFromBaseURL(), {
        email,
        senha: password, // compat PT
        password,        // compat EN
      });

      const data = res.data ?? {};
      const token = extractToken(data);
      if (!token) throw new Error("Login não retornou token.");

      // salva token
      setToken(token);

      // role (se vier no response)
      const role = extractRole(data);
      if (role) setRole(role);

      // user (se vier no response)
      const u = extractUser(data);
      if (u) setUser(u);

      // ✅ atualiza estado local (UI reativa)
      setUserState(u ?? getUser<AuthUser>() ?? null);
      setRoleState(role || getRole() || "");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAuth();
    setUserState(null);
    setRoleState("");
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user: userState,
      role: roleState,
      login,
      logout,
      loading,
      setSession,
    }),
    [userState, roleState, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  // Mantém seu fallback (pra não quebrar se esquecer Provider),
  // mas agora tipado e explícito.
  if (!ctx) {
    return {
      user: null,
      role: "",
      login: async () => {
        throw new Error("AuthProvider não está no layout.tsx");
      },
      logout: () => {},
      loading: false,
      setSession: () => {},
    } as AuthContextValue;
  }

  return ctx;
}
