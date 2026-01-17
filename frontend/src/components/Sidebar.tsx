// frontend/src/components/Sidebar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { isAuthed, buildLoginUrl, isAdmin } from "@/services/auth";

type Props = {
  collapsed?: boolean;
  onToggle?: () => void;
  onLogout?: () => void;
};

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 20V6a2 2 0 0 1 2-2h6v16H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M12 20V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v11H12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M7 8h2M7 11h2M7 14h2M15 12h2M15 15h2"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.8"
      />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 13c0-4.418 3.582-8 8-8s8 3.582 8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M12 13l4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M4 13h16"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.35"
      />
      <path
        d="M12 13a1.2 1.2 0 1 0 0.001 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M16 20c0-2.21-1.79-4-4-4s-4 1.79-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M12 12a3.2 3.2 0 1 0-0.001 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M20 20c0-1.7-1.05-3.16-2.55-3.76"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.55"
      />
      <path
        d="M17.3 7.9a2.5 2.5 0 1 0 0 4.9"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.55"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M10 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.9"
      />
      <path
        d="M13 12H4"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M7 9l-3 3 3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
    </svg>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggle,
  onLogout,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  function go(path: string) {
    if (!isAuthed()) {
      router.push(buildLoginUrl(path));
      return;
    }
    router.push(path);
  }

  const itemBase =
    "w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition " +
    "ring-1 ring-white/10 bg-white/0 hover:bg-white/5";

  const active =
    "bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/20 " +
    "shadow-[0_0_0_1px_rgba(255,214,102,0.12)]";

  const normal = "text-white/85";
  const headerGlow = "shadow-[0_18px_60px_rgba(0,0,0,0.55)]";

  const admin = isAdmin();

  return (
    <div className={"relative h-full " + headerGlow}>
      {/* ✅ Botão Toggle NA LATERAL DIREITA (roxo) */}
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className={[
            "absolute right-[-14px] top-1/2 -translate-y-1/2 z-20",
            "h-10 w-10 rounded-full",
            "bg-white/6 hover:bg-white/10",
            "text-white/85",
            "ring-1 ring-white/15",
            "shadow-[0_10px_30px_rgba(0,0,0,0.30)]",
            "backdrop-blur",
            "flex items-center justify-center",
            "active:scale-[0.98] transition",
          ].join(" ")}
          title={collapsed ? "Abrir menu" : "Ocultar menu"}
        >
          {collapsed ? "→" : "←"}
        </button>
      ) : null}

      {/* layout vertical */}
      <div className="flex h-full flex-col">
        {/* TOPO */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-lg font-extrabold tracking-tight text-white">
            {!collapsed ? "CRM Imobiliária" : "CRM"}
          </div>
          {/* reserva espaço visual no topo */}
          <div className="w-8" />
        </div>

        <div className="my-5 h-px w-full bg-white/10" />

        {/* MENU */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => go("/imoveis")}
            className={[
              itemBase,
              pathname.startsWith("/imoveis") ? active : normal,
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-3">
              <span className="text-white/70">
                <IconBuilding />
              </span>
              {!collapsed ? "Imóveis" : null}
            </span>
            {collapsed ? <span className="sr-only">Imóveis</span> : null}
          </button>

          {admin ? (
            <button
              type="button"
              onClick={() => go("/dashboard")}
              className={[
                itemBase,
                pathname.startsWith("/dashboard") ? active : normal,
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-3">
                <span className="text-white/70">
                  <IconDashboard />
                </span>
                {!collapsed ? "Dashboard" : null}
              </span>
              {collapsed ? <span className="sr-only">Dashboard</span> : null}
            </button>
          ) : null}

          {admin ? (
            <button
              type="button"
              onClick={() => go("/corretores")}
              className={[
                itemBase,
                pathname.startsWith("/corretores") ? active : normal,
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-3">
                <span className="text-white/70">
                  <IconUsers />
                </span>
                {!collapsed ? "Corretores" : null}
              </span>
              {collapsed ? <span className="sr-only">Corretores</span> : null}
            </button>
          ) : null}
        </div>

        {/* ✅ empurra o sair pro extremo sul (vermelho) */}
        <div className="flex-1" />

        {onLogout ? (
          <div className="pb-4 pt-3">
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-xl bg-rose-500/10 px-4 py-3 text-left text-sm font-extrabold text-rose-100 ring-1 ring-rose-400/20 hover:bg-rose-500/14"
            >
              <span className="inline-flex items-center gap-3">
                <span className="text-rose-200/90">
                  <IconLogout />
                </span>
                {!collapsed ? "Sair" : null}
              </span>
              {collapsed ? <span className="sr-only">Sair</span> : null}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
