// frontend/src/components/AppShell.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { clearAuth, isAdmin, isAuthed } from "@/services/auth";

function isPublicRoute(path: string) {
  return path === "/login";
}

function isProtectedRoute(path: string) {
  return (
    path.startsWith("/imoveis") ||
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
  const protectedRoute = useMemo(() => isProtectedRoute(pathname), [pathname]);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;

    if (publicRoute) return;

    if (protectedRoute) {
      if (!isAuthed() || !isAdmin()) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }
  }, [ready, publicRoute, protectedRoute, router, pathname]);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  if (!ready) return null;

  if (publicRoute) return <>{children}</>;

  if (protectedRoute) {
    if (!isAuthed() || !isAdmin()) return null;

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen">
          <aside
            className={[
              "hidden lg:block border-r border-white/10",
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
