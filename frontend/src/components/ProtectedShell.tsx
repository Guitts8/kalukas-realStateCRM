// frontend/src/components/ProtectedShell.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { clearAuth, isAdmin, isAuthed, buildLoginUrl } from "@/services/auth";
import { useAuth } from "@/contexts/authContext";

export default function ProtectedShell({
  children,
  requireAdmin = false,
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
    // ✅ trava render até validar
    if (!isAuthed()) {
      setChecking(false);
      router.replace(buildLoginUrl(pathname));
      return;
    }

    if (requireAdmin && !isAdmin()) {
      setChecking(false);
      router.replace(buildLoginUrl(pathname));
      return;
    }

    setChecking(false);
  }, [pathname, requireAdmin, router]);

  function handleLogout() {
    // limpa tudo
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

  // ✅ Se não authed, não renderiza nada (o router já redireciona)
  if (!isAuthed() || (requireAdmin && !isAdmin())) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={[
            "hidden lg:block border-r border-white/10", // ✅ linha discreta (o que você pediu)
            collapsed ? "w-[86px]" : "w-[280px]",
          ].join(" ")}
        >
          <div className="p-6">
            <Sidebar
              collapsed={collapsed}
              onToggle={() => setCollapsed((v) => !v)}
              onLogout={handleLogout}
            />
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="flex-1">
          <div className="px-6 py-6 lg:px-10 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
