// frontend/src/components/Sidebar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { isAuthed, buildLoginUrl } from "@/services/auth";

type Props = {
  collapsed?: boolean;
  onToggle?: () => void;
  onLogout?: () => void;
};

export default function Sidebar({ collapsed = false, onToggle, onLogout }: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  function go(path: string) {
    // ✅ mesmo clicando, se não estiver logado -> vai pro login
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

  const headerGlow = "shadow-[0_18px_60px_rgba(0,0,0,0.55)]"; // ✅ menor glow

  return (
    <div className={"h-full " + headerGlow}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-extrabold tracking-tight text-white">
          {!collapsed ? "CRM Imobiliária" : "CRM"}
        </div>

        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-white/80 ring-1 ring-white/10 hover:bg-white/8"
            title={collapsed ? "Abrir menu" : "Ocultar menu"}
          >
            {collapsed ? "→" : "←"}
          </button>
        ) : null}
      </div>

      {/* ✅ linha discreta separando */}
      <div className="my-5 h-px w-full bg-white/10" />

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => go("/imoveis")}
          className={[
            itemBase,
            pathname.startsWith("/imoveis") ? active : normal,
          ].join(" ")}
        >
          {!collapsed ? "Imóveis" : "I"}
        </button>

                <button
          type="button"
          onClick={() => go("/corretores")}
          className={[
            itemBase,
            pathname.startsWith("/corretores") ? active : normal,
          ].join(" ")}
        >
          {!collapsed ? "Corretores" : "U"}
        </button>


        {onLogout ? (
          <div className="pt-3">
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-xl bg-rose-500/10 px-4 py-3 text-left text-sm font-extrabold text-rose-100 ring-1 ring-rose-400/20 hover:bg-rose-500/14"
            >
              {!collapsed ? "Sair" : "⎋"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
