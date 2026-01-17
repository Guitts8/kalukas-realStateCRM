// frontend/src/components/AppShell.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { clearAuth, isAdmin, isAuthed } from "@/services/auth";

function isPublicRoute(path: string) {
  return path === "/login";
}

// ✅ qualquer logado
function isProtectedAnyAuthed(path: string) {
  return path.startsWith("/imoveis");
}

// ✅ somente admin
function isProtectedAdmin(path: string) {
  return (
    path.startsWith("/dashboard") ||
    path.startsWith("/corretores") ||
    path.startsWith("/usuarios")
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const publicRoute = useMemo(() => isPublicRoute(pathname), [pathname]);
  const protectedAny = useMemo(() => isProtectedAnyAuthed(pathname), [pathname]);
  const protectedAdmin = useMemo(() => isProtectedAdmin(pathname), [pathname]);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;

    if (publicRoute) return;

    // ✅ rotas que exigem apenas estar logado
    if (protectedAny) {
      if (!isAuthed()) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    // ✅ rotas somente admin
    if (protectedAdmin) {
      if (!isAuthed() || !isAdmin()) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
      return;
    }
  }, [ready, publicRoute, protectedAny, protectedAdmin, router, pathname]);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  if (!ready) return null;

  if (publicRoute) return <>{children}</>;

  // ✅ decide se a rota deve renderizar shell (sidebar)
  const shouldRenderShell = protectedAny || protectedAdmin;

  if (shouldRenderShell) {
    // ✅ se for admin-only e não for admin, não renderiza nada (redirect já roda no useEffect)
    if (protectedAdmin && (!isAuthed() || !isAdmin())) return null;

    // ✅ se for any-auth e não estiver logado, não renderiza nada (redirect já roda no useEffect)
    if (protectedAny && !isAuthed()) return null;

    return (
<div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-white">
        <div className="flex min-h-screen">
          <aside
            className={[
"hidden lg:block border-r border-zinc-900/10 dark:border-white/10",
              sidebarCollapsed ? "w-[86px]" : "w-[280px]",
            ].join(" ")}
          >
            <div className="p-6">
              <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((v) => !v)}
                onLogout={handleLogout}
              />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="px-6 py-6 lg:px-10 lg:py-10">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
