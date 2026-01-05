"use client";

import { createContext, useContext, useState } from "react";
import { api } from "@/services/api";

type User = {
  id: string;
  role: "ADMIN" | "USER";
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });

    const token = res.data.token;
    localStorage.setItem("token", token);

    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser({ id: payload.id, role: payload.role });
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
