"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { decodeJwtPayload, getToken } from "@/services/auth";

type Corretor = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  isAdmin: boolean;
  createdAt: string;
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

function Segmented({
  value,
  onChange,
}: {
  value: "ALL" | "ADMIN" | "USER";
  onChange: (v: "ALL" | "ADMIN" | "USER") => void;
}) {
  const base =
    "rounded-full px-3 py-1.5 text-xs font-black tracking-widest transition ring-1";
  const active =
    "bg-amber-300/12 text-amber-100 ring-amber-300/25 shadow-[0_0_18px_rgba(251,191,36,0.10)]";
  const normal = "bg-white/6 text-white/65 ring-white/10 hover:bg-white/8";

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-black/20 p-1 ring-1 ring-white/10">
      <button
        type="button"
        onClick={() => onChange("ALL")}
        className={`${base} ${value === "ALL" ? active : normal}`}
      >
        TODOS
      </button>
      <button
        type="button"
        onClick={() => onChange("ADMIN")}
        className={`${base} ${value === "ADMIN" ? active : normal}`}
      >
        ADM
      </button>
      <button
        type="button"
        onClick={() => onChange("USER")}
        className={`${base} ${value === "USER" ? active : normal}`}
      >
        CORRETOR
      </button>
    </div>
  );
}

export default function CorretoresPage() {
  const router = useRouter();

  const [items, setItems] = useState<Corretor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ busca + filtro
  const [q, setQ] = useState("");
  const [perfil, setPerfil] = useState<"ALL" | "ADMIN" | "USER">("ALL");

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

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/users");
      setItems(res.data ?? []);
    } catch {
      setError("Erro ao carregar corretores.");
    } finally {
      setLoading(false);
    }
  }

  async function remover(id: string) {
    const meId = getMeId();
    if (id === meId) {
      setError("Você não pode remover seu próprio usuário.");
      return;
    }

    if (!confirm("Deseja remover este corretor?")) return;

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
    const admins = items.filter((x) => x.isAdmin || x.role === "ADMIN").length;
    const corretores = total - admins;
    return { total, admins, corretores };
  }, [items]);

  // ✅ lista filtrada por busca + perfil
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return items.filter((u) => {
      const admin = u.isAdmin || u.role === "ADMIN";

      // filtro por perfil
      if (perfil === "ADMIN" && !admin) return false;
      if (perfil === "USER" && admin) return false;

      // busca
      if (!term) return true;
      const hay = `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [items, q, perfil]);

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1180px]">
        <div className={`${headerCard} p-6`}>Carregando…</div>
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

              <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/10">
                Mostrando: {filtered.length}
              </span>
            </div>
          </div>

          {/* Busca + filtro + ações */}
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {/* Busca */}
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome ou email…"
                  className={
                    "w-[320px] max-w-full rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 " +
                    "text-sm text-white/90 placeholder:text-white/25 outline-none " +
                    "focus:border-white/18 focus:ring-2 focus:ring-amber-300/10"
                  }
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/10"
                    title="Limpar"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              {/* Filtro */}
              <Segmented value={perfil} onChange={setPerfil} />
            </div>

            <div className="flex gap-3 justify-end">
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
          const admin = u.isAdmin || u.role === "ADMIN";
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

              <div className="col-span-2">
                {admin ? pill("admin") : pill("user")}
              </div>

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
                  onClick={() => remover(u.id)}
                >
                  {actionLoading === u.id ? "Removendo…" : "Remover"}
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-white/55">
            Nenhum corretor encontrado para o filtro/pesquisa atual.
          </div>
        ) : null}
      </div>
    </div>
  );
}
