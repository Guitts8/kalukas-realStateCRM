"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { decodeJwtPayload, getToken } from "@/services/auth";
import { useConfirm } from "@/hooks/useConfirm";

type Corretor = {
  id: string;
  name: string;
  email: string;
  role?: "ADMIN" | "USER" | string;
  isAdmin?: boolean;
  createdAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

function getMeId(): string {
  const payload = decodeJwtPayload(getToken());
  return (payload?.id ?? "").toString();
}

function isUserAdmin(u: Corretor) {
  return !!(u?.isAdmin || String(u?.role ?? "").toUpperCase() === "ADMIN");
}

type RoleFilter = "ALL" | "ADMIN" | "USER";

export default function CorretoresPage() {
  const router = useRouter();
  const { confirm, ConfirmUI } = useConfirm();

  const [items, setItems] = useState<Corretor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ filtros
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const headerCard =
    "rounded-3xl bg-white/[0.035] ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]";
  const tableCard =
    "rounded-3xl bg-white/[0.03] ring-1 ring-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.50)] overflow-hidden";

  const btnAmber =
    "rounded-xl border border-amber-400/25 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 " +
    "shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_12px_40px_rgba(251,191,36,0.10)] " +
    "hover:bg-amber-300/15 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_18px_70px_rgba(251,191,36,0.16)] " +
    "active:scale-[0.99] transition";

  const btnNeutral =
    "rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 " +
    "hover:bg-white/8 active:scale-[0.99] transition";

  const btnDanger =
    "rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 " +
    "hover:bg-rose-500/14 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed";

  function pill(kind: "admin" | "user") {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide ring-1";
    if (kind === "admin") {
      return (
        <span
          className={`${base} bg-amber-300/10 text-amber-100 ring-amber-300/25 shadow-[0_0_18px_rgba(251,191,36,0.10)]`}
        >
          Admin
        </span>
      );
    }
    return (
      <span className={`${base} bg-white/6 text-white/75 ring-white/10`}>
        Corretor
      </span>
    );
  }

  const segmentedWrap =
    "inline-flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10";
  const segBtn =
    "rounded-full px-3 py-1 text-xs font-extrabold tracking-wide transition";
  const segOn = "bg-white/10 ring-1 ring-white/20 text-white";
  const segOff = "text-white/60 hover:text-white/85";

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/users");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Erro ao carregar corretores.");
    } finally {
      setLoading(false);
    }
  }

  async function remover(id: string, nome?: string) {
    const meId = getMeId();
    if (id === meId) {
      setError("Você não pode remover seu próprio usuário.");
      return;
    }

    const ok = await confirm({
      title: "Remover corretor",
      description: `Deseja remover ${
        nome?.trim() ? `"${nome}"` : "este corretor"
      }? Essa ação não pode ser desfeita.`,
      confirmText: "Remover",
      cancelText: "Cancelar",
      danger: true,
    });

    if (!ok) return;

    try {
      setActionLoading(id);
      setMessage(null);
      setError(null);

      await api.delete(`/users/${id}`);
      setMessage("Corretor removido com sucesso.");
      await load();
    } catch {
      setError("Erro ao remover corretor.");
    } finally {
      setActionLoading(null);
    }
  }

  const stats = useMemo(() => {
    const total = items.length;
    const admins = items.filter(isUserAdmin).length;
    const corretores = total - admins;
    return { total, admins, corretores };
  }, [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return items.filter((u) => {
      const admin = isUserAdmin(u);

      if (roleFilter === "ADMIN" && !admin) return false;
      if (roleFilter === "USER" && admin) return false;

      if (!qq) return true;

      const name = (u.name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return name.includes(qq) || email.includes(qq);
    });
  }, [items, q, roleFilter]);

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1180px]">
        <div className={`${headerCard} p-6`}>Carregando…</div>
        {ConfirmUI}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      {/* Header */}
      <div className={`${headerCard} p-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Corretores</h1>
            <p className="mt-2 text-white/55">
              Gerencie usuários, permissões e perfis com visual moderno e rápido.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                Total: {stats.total}
              </span>
              <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                Corretores: {stats.corretores}
              </span>
              <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100 ring-1 ring-amber-300/25">
                Admins: {stats.admins}
              </span>
              <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                Mostrando: {filtered.length}
              </span>
            </div>

            {/* ✅ Barra de filtros (voltou) */}
            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full rounded-2xl bg-white/[0.03] px-4 py-3 text-sm text-white/90 placeholder:text-white/35 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-amber-300/25"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black tracking-widest text-white/45">
                    PERFIL
                  </span>

                  <div className={segmentedWrap}>
                    <button
                      type="button"
                      onClick={() => setRoleFilter("ALL")}
                      className={[segBtn, roleFilter === "ALL" ? segOn : segOff].join(" ")}
                    >
                      TODOS
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter("ADMIN")}
                      className={[segBtn, roleFilter === "ADMIN" ? segOn : segOff].join(" ")}
                    >
                      ADM
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter("USER")}
                      className={[segBtn, roleFilter === "USER" ? segOn : segOff].join(" ")}
                    >
                      CORRETOR
                    </button>
                  </div>
                </div>

                {(q.trim() || roleFilter !== "ALL") && (
                  <button
                    type="button"
                    className={btnNeutral}
                    onClick={() => {
                      setQ("");
                      setRoleFilter("ALL");
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className={btnAmber}
              onClick={() => router.push("/corretores/novo")}
            >
              Novo corretor
            </button>
            <button className={btnNeutral} onClick={load}>
              Recarregar
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {message ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-emerald-100 ring-1 ring-emerald-300/10">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-rose-100 ring-1 ring-rose-300/10">
          {error}
        </div>
      ) : null}

      {/* Table */}
      <div className={tableCard}>
        <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-white/[0.02] px-6 py-4 text-[11px] font-black tracking-widest text-white/50">
          <div className="col-span-4">NOME</div>
          <div className="col-span-4">EMAIL</div>
          <div className="col-span-2">PERFIL</div>
          <div className="col-span-2 text-right">AÇÕES</div>
        </div>

        {filtered.map((u) => {
          const admin = isUserAdmin(u);
          return (
            <div
              key={u.id}
              className="grid grid-cols-12 gap-3 px-6 py-5 border-b border-white/10 last:border-b-0 hover:bg-white/[0.02] transition"
            >
              <div className="col-span-4">
                <div className="text-base font-extrabold">{u.name}</div>
                <div className="mt-1 text-xs text-white/40">
                  Criado em: {formatDate(u.createdAt)}
                </div>
              </div>

              <div className="col-span-4">
                <div className="text-sm text-white/80">{u.email}</div>
              </div>

              <div className="col-span-2">{admin ? pill("admin") : pill("user")}</div>

              <div className="col-span-2 flex justify-end gap-2">
                <button
                  className={btnNeutral}
                  onClick={() => router.push(`/corretores/${u.id}/editar`)}
                >
                  Editar
                </button>
                <button
                  className={btnDanger}
                  disabled={actionLoading === u.id}
                  onClick={() => remover(u.id, u.name)}
                >
                  {actionLoading === u.id ? "Removendo…" : "Remover"}
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-white/55">
            Nenhum corretor encontrado com esses filtros.
          </div>
        ) : null}
      </div>

      {/* ✅ Confirm modal do site */}
      {ConfirmUI}
    </div>
  );
}
