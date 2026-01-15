// frontend/src/components/ProtectedShell.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { buildLoginUrl, clearAuth, decodeJwtPayload, getToken, isAdmin } from "@/services/auth";
import { useAuth } from "@/contexts/authContext";

export default function ProtectedShell({
  children,
  requireAdmin = true,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/imoveis";
  const { logout } = useAuth();

  const [checking, setChecking] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setChecking(false);
      router.replace(buildLoginUrl(pathname));
      return;
    }

    const payload = decodeJwtPayload(token);

    // se token inválido
    if (!payload) {
      clearAuth();
      setChecking(false);
      router.replace(buildLoginUrl(pathname));
      return;
    }

    // expiração (se existir)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      clearAuth();
      setChecking(false);
      router.replace(buildLoginUrl(pathname));
      return;
    }

    // exige admin
    if (requireAdmin && !isAdmin()) {
      setChecking(false);
      router.replace(buildLoginUrl(pathname));
      return;
    }

    setChecking(false);
  }, [pathname, requireAdmin, router]);

  function handleLogout() {
    clearAuth();
    logout?.();
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-[1180px] px-6 py-10">
          <div className="rounded-3xl bg-white/[0.035] p-6 ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            Verificando acesso…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <aside className={["hidden lg:block border-r border-white/10", collapsed ? "w-[86px]" : "w-[280px]"].join(" ")}>
          <div className="p-6">
            <Sidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed((v) => !v)}
              onLogout={handleLogout}
            />
          </div>
        </aside>

        <main className="flex-1">
          <div className="px-6 py-6 lg:px-10 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
