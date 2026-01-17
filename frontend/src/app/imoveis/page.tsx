// frontend/src/app/imoveis/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { isAdmin } from "@/services/auth";

type Foto = {
  id?: string;
  url: string;
  ordem?: number;
};

type ImovelListItem = {
  id: string;
  titulo?: string;
  cidade?: string;
  bairro?: string;
  valor?: number;

  haPlaca?: boolean;
  situacao?: string;

  nomeContato?: string;
  contatoNome?: string;
  telefoneContato?: string;
  contatoTelefone?: string;

  fotos?: Foto[];
};

type PreviewData = {
  fotos: Foto[];
  nomeContato?: string;
  telefoneContato?: string;
};

type PlacaFilter = "ALL" | "COM" | "SEM";
type SituacaoFilter = "ALL" | "VENDER" | "ALUGAR";

function asNumber(v: any): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function moneyBRL(v: any) {
  const n = asNumber(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeSituacao(raw?: string) {
  const s = (raw ?? "").toString().trim().toUpperCase();
  if (s.includes("ALUG")) return "PARA ALUGAR";
  if (s.includes("VEND")) return "PARA VENDER";
  if (s.includes("INAT")) return "INATIVO";
  return s || "—";
}

function normalizePhotoPath(raw?: string) {
  if (!raw) return "";
  let s = String(raw).trim();

  if (s.startsWith("file:")) return "";

  s = s.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(s)) return s;

  const low = s.toLowerCase();
  const idx = low.indexOf("/uploads/");
  if (idx >= 0) return s.slice(idx);

  const idx2 = low.indexOf("uploads/");
  if (idx2 >= 0) return "/" + s.slice(idx2);

  if (!s.startsWith("/")) s = "/" + s;
  return s;
}

function getApiBase() {
  const envBase = (process.env.NEXT_PUBLIC_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (envBase) return envBase;

  const axiosBase = (api.defaults.baseURL ?? "")
    .toString()
    .trim()
    .replace(/\/$/, "");
  return axiosBase;
}

function getUploadsBase() {
  const base = getApiBase().replace(/\/$/, "");
  if (!base) return "";
  return base.replace(/\/api\/?$/i, "");
}

function resolveImgUrl(url?: string) {
  const normalized = normalizePhotoPath(url);
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const base = getUploadsBase();
  if (!base) return normalized;

  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${base}${path}`;
}

async function copyText(text: string) {
  const t = (text ?? "").toString().trim();
  if (!t) return;

  try {
    await navigator.clipboard.writeText(t);
    return;
  } catch {}

  try {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  } catch {}
}

function tagClass(kind: "good" | "bad" | "neutral") {
  if (kind === "good") {
    return "bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/30 shadow-[0_0_18px_rgba(16,185,129,0.12)]";
  }
  if (kind === "bad") {
    return "bg-rose-500/12 text-rose-200 ring-1 ring-rose-400/30 shadow-[0_0_18px_rgba(244,63,94,0.10)]";
  }
  return "bg-white/6 text-white/80 ring-1 ring-white/10";
}

function pill(kind: "good" | "bad" | "neutral", text: string) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide",
        tagClass(kind),
      ].join(" ")}
    >
      {text}
    </span>
  );
}

function situacaoToPill(situacaoRaw?: string) {
  const s = normalizeSituacao(situacaoRaw);
  if (s === "PARA VENDER") return pill("good", "Para vender");
  if (s === "PARA ALUGAR") return pill("good", "Para alugar");
  if (s === "INATIVO") return pill("bad", "Inativo");
  return pill("neutral", s);
}

function placaToPill(haPlaca?: boolean) {
  if (haPlaca) return pill("good", "Com placa");
  return pill("bad", "Sem placa");
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M9 9h10v10H9V9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.95"
      />
    </svg>
  );
}

/* =========================
   Modal de confirmação (UI do site)
   ========================= */
function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white/[0.06] ring-1 ring-white/12 shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/10">
          <div className="text-lg font-extrabold tracking-tight text-white">
            {title}
          </div>
          {description ? (
            <div className="mt-1 text-sm text-white/65">{description}</div>
          ) : null}
        </div>

        <div className="px-6 py-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] ring-1 ring-white/10 bg-white/5 hover:bg-white/8 text-white/85"
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              "inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-extrabold transition-all duration-200 active:scale-[0.99]",
              danger
                ? "bg-rose-500/12 text-rose-100 ring-1 ring-rose-400/25 hover:bg-rose-500/16 shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_18px_rgba(244,63,94,0.10)]"
                : "bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/25 hover:bg-amber-300/14 shadow-[0_0_0_1px_rgba(255,214,102,0.18),0_0_22px_rgba(255,214,102,0.10)]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {loading ? "Aguarde…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImoveisPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [imoveis, setImoveis] = useState<ImovelListItem[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const [previewCache, setPreviewCache] = useState<Record<string, PreviewData>>(
    {}
  );
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>(
    {}
  );

  const [copiedById, setCopiedById] = useState<Record<string, boolean>>({});

  const inflight = useRef<Set<string>>(new Set());

  // filtros
  const [search, setSearch] = useState("");
  const [placa, setPlaca] = useState<PlacaFilter>("ALL");
  const [situacao, setSituacao] = useState<SituacaoFilter>("ALL");

  // modal remover
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // admin (pra mostrar Comprometer)
  const admin = useMemo(() => isAdmin(), []);

  async function carregarImoveis() {
    setLoading(true);
    try {
      const res = await api.get("/imoveis");
      const data: ImovelListItem[] = Array.isArray(res.data) ? res.data : [];
      setImoveis(data);
    } catch {
      alert("Erro ao carregar imóveis");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarImoveis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPreview(id: string) {
    if (!id) return;
    if (previewCache[id]) return;
    if (inflight.current.has(id)) return;

    inflight.current.add(id);
    setPreviewLoading((p) => ({ ...p, [id]: true }));

    try {
      const res = await api.get(`/imoveis/${id}`);
      const d = res.data ?? {};

      const fotos: Foto[] = Array.isArray(d.fotos) ? d.fotos : [];
      const nomeContato =
        d.nomeContato ?? d.contatoNome ?? d.nome_contato ?? d.contato ?? "";
      const telefoneContato =
        d.telefoneContato ??
        d.contatoTelefone ??
        d.telefone_contato ??
        d.telefone ??
        "";

      setPreviewCache((p) => ({
        ...p,
        [id]: { fotos, nomeContato, telefoneContato },
      }));
    } catch {
      setPreviewCache((p) => ({
        ...p,
        [id]: { fotos: [], nomeContato: "", telefoneContato: "" },
      }));
    } finally {
      inflight.current.delete(id);
      setPreviewLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function preloadAllPreviews(list: ImovelListItem[]) {
    const ids = list.map((x) => x.id).filter(Boolean);
    const pendentes = ids.filter((id) => !previewCache[id]);

    if (pendentes.length === 0) return;

    const CONCURRENCY = 6;
    let idx = 0;

    async function worker() {
      while (idx < pendentes.length) {
        const id = pendentes[idx++];
        await fetchPreview(id);
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.allSettled(workers);
  }

  useEffect(() => {
    if (!previewMode) return;
    if (imoveis.length === 0) return;
    preloadAllPreviews(filteredImoveisMemo(imoveis, search, placa, situacao));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, imoveis, search, placa, situacao]);

  function abrirConfirmRemover(id: string) {
    setConfirmId(id);
    setConfirmOpen(true);
  }

  async function removerImovelConfirmado() {
    const id = confirmId;
    if (!id) return;

    try {
      setConfirmLoading(true);

      await api.delete(`/imoveis/${id}`);
      setImoveis((p) => p.filter((x) => x.id !== id));
      setPreviewCache((p) => {
        const copy = { ...p };
        delete copy[id];
        return copy;
      });
      setPreviewLoading((p) => {
        const copy = { ...p };
        delete copy[id];
        return copy;
      });
    } catch {
      alert("Erro ao remover imóvel");
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmId(null);
    }
  }

  const totalAll = imoveis.length;
  const somaValores = useMemo(() => {
    return imoveis.reduce((acc, i) => acc + asNumber(i.valor), 0);
  }, [imoveis]);

  const filtered = useMemo(
    () => filteredImoveisMemo(imoveis, search, placa, situacao),
    [imoveis, search, placa, situacao]
  );

  const totalFiltered = filtered.length;

  const btnBase =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] ring-1 ring-white/10 bg-white/5 hover:bg-white/8";
  const btnGold =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-extrabold tracking-wide transition-all duration-200 active:scale-[0.99] " +
    "bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/25 hover:bg-amber-300/14 " +
    "shadow-[0_0_0_1px_rgba(255,214,102,0.18),0_0_22px_rgba(255,214,102,0.10)]";
  const btnWarn =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold transition-all duration-200 active:scale-[0.99] " +
    "bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/25 hover:bg-amber-300/14 " +
    "shadow-[0_0_0_1px_rgba(255,214,102,0.16),0_0_18px_rgba(255,214,102,0.08)]";
  const btnDanger =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold transition-all duration-200 active:scale-[0.99] " +
    "bg-rose-500/10 text-rose-100 ring-1 ring-rose-400/25 hover:bg-rose-500/14 " +
    "shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_18px_rgba(244,63,94,0.10)]";
  const btnGhost =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] " +
    "bg-white/4 text-white/85 ring-1 ring-white/10 hover:bg-white/7";

  const segBtnBase =
    "rounded-full px-3 py-1 text-xs font-extrabold transition-all ring-1";
  const segActive =
    "bg-amber-300/10 text-amber-100 ring-amber-300/25 shadow-[0_0_18px_rgba(255,214,102,0.10)]";
  const segInactive = "bg-white/5 text-white/70 ring-white/10 hover:bg-white/8";

  const card =
    "rounded-3xl bg-white/[0.035] ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]";

  if (loading) {
    return (
      <div className="p-10 text-white/80">
        <div className={card + " p-6"}>Carregando…</div>
      </div>
    );
  }

  return (
    <div className="p-10 text-white">
      {/* MODAL REMOVER */}
      <ConfirmModal
        open={confirmOpen}
        title="Remover imóvel?"
        description="Essa ação remove o imóvel do sistema."
        confirmText="Remover"
        cancelText="Cancelar"
        danger
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmId(null);
        }}
        onConfirm={removerImovelConfirmado}
      />

      {/* HEADER */}
      <div className={card + " p-8"}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Imóveis</h1>
            <p className="mt-1 text-white/65">
              Gerencie sua carteira de imóveis com visual moderno e rápido.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {pill("neutral", `Total: ${totalAll}`)}
              {pill("neutral", `Soma valores: ${moneyBRL(somaValores)}`)}
              {pill("neutral", `Mostrando: ${totalFiltered}`)}

              <div className="ml-1 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                <span className="text-xs text-white/70">Modo:</span>
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-bold transition-all",
                    !previewMode
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "text-white/60 hover:text-white/85",
                  ].join(" ")}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(true)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-bold transition-all",
                    previewMode
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "text-white/60 hover:text-white/85",
                  ].join(" ")}
                >
                  Prévia
                </button>
              </div>

              {previewMode && (
                <span className="text-xs text-white/55">
                  (Carregando automaticamente todas as prévias)
                </span>
              )}
            </div>

            {/* FILTROS */}
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, cidade ou bairro…"
                    className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/35 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-amber-200/20"
                  />
                </div>

                <button
                  className={btnBase}
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPlaca("ALL");
                    setSituacao("ALL");
                  }}
                  title="Limpar filtros"
                >
                  Limpar
                </button>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black tracking-widest text-white/45">
                      PLACA
                    </span>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 ring-1 ring-white/10">
                      <button
                        type="button"
                        onClick={() => setPlaca("ALL")}
                        className={[
                          segBtnBase,
                          placa === "ALL" ? segActive : segInactive,
                        ].join(" ")}
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlaca("COM")}
                        className={[
                          segBtnBase,
                          placa === "COM" ? segActive : segInactive,
                        ].join(" ")}
                      >
                        Com placa
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlaca("SEM")}
                        className={[
                          segBtnBase,
                          placa === "SEM" ? segActive : segInactive,
                        ].join(" ")}
                      >
                        Sem placa
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black tracking-widest text-white/45">
                      SITUAÇÃO
                    </span>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 ring-1 ring-white/10">
                      <button
                        type="button"
                        onClick={() => setSituacao("ALL")}
                        className={[
                          segBtnBase,
                          situacao === "ALL" ? segActive : segInactive,
                        ].join(" ")}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => setSituacao("VENDER")}
                        className={[
                          segBtnBase,
                          situacao === "VENDER" ? segActive : segInactive,
                        ].join(" ")}
                      >
                        Vender
                      </button>
                      <button
                        type="button"
                        onClick={() => setSituacao("ALUGAR")}
                        className={[
                          segBtnBase,
                          situacao === "ALUGAR" ? segActive : segInactive,
                        ].join(" ")}
                      >
                        Alugar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-white/45">
                  Filtrando por: nome, cidade ou bairro
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={btnGold}
              onClick={() => router.push("/imoveis/novo")}
            >
              Novo imóvel
            </button>
            <button className={btnBase} onClick={() => router.push("/login")}>
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-8">
        {!previewMode ? (
          // ===== LISTA =====
          <div className={card + " overflow-hidden"}>
            <div className="grid grid-cols-12 gap-0 border-b border-white/10 bg-white/5 px-6 py-4 text-xs font-extrabold tracking-widest text-white/70">
              <div className="col-span-4">TÍTULO</div>
              <div className="col-span-2">CIDADE</div>
              <div className="col-span-2">VALOR</div>
              <div className="col-span-1">PLACA</div>
              <div className="col-span-1">SITUAÇÃO</div>
              <div className="col-span-1 text-right">AÇÕES</div>
            </div>

            {filtered.map((i) => (
              <div
                key={i.id}
                className="grid grid-cols-12 items-center gap-0 border-b border-white/5 px-6 py-5 hover:bg-white/[0.03]"
              >
                <div className="col-span-4">
                  <div className="font-extrabold">{i.titulo ?? "—"}</div>
                  <div className="mt-1 text-xs text-white/40">ID: {i.id}</div>
                </div>

                <div className="col-span-2 font-semibold text-white/85">
                  {i.cidade ?? "—"}
                </div>

                <div className="col-span-2 font-extrabold">
                  {moneyBRL(i.valor ?? 0)}
                </div>

                <div className="col-span-1">
                  {i.haPlaca ? (
                    <span className="text-emerald-200/90">Sim</span>
                  ) : (
                    <span className="text-rose-200/90">Não</span>
                  )}
                </div>

                <div className="col-span-1">
                  {normalizeSituacao(i.situacao) === "INATIVO"
                    ? "Inativo"
                    : normalizeSituacao(i.situacao) === "PARA VENDER"
                    ? "Vender"
                    : normalizeSituacao(i.situacao) === "PARA ALUGAR"
                    ? "Alugar"
                    : "—"}
                </div>

                <div className="col-span-2 flex justify-end gap-2 whitespace-nowrap">
                  {admin ? (
                    <button
                      className={btnWarn}
                      onClick={() =>
                        router.push(`/imoveis/${i.id}/comprometer`)
                      }
                      title="Registrar venda/aluguel"
                    >
                      Comprometer
                    </button>
                  ) : null}

                  <button
                    className={btnGhost}
                    onClick={() => router.push(`/imoveis/${i.id}`)}
                  >
                    Ver
                  </button>

                  <button
                    className={btnDanger}
                    onClick={() => abrirConfirmRemover(i.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="px-6 py-10 text-white/55">
                Nenhum imóvel encontrado com os filtros atuais.
              </div>
            ) : null}
          </div>
        ) : (
          // ===== PRÉVIA (CARDS) =====
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filtered.map((i) => {
              const prev = previewCache[i.id];
              const isLoading = !!previewLoading[i.id];

              const fotos = (prev?.fotos?.length ? prev.fotos : i.fotos) ?? [];
              const ordered = [...fotos].sort(
                (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
              );

              const main = ordered[0]?.url ? resolveImgUrl(ordered[0].url) : "";
              const thumbs = ordered
                .slice(1, 5)
                .map((f) => resolveImgUrl(f.url));
              const extra = Math.max(0, ordered.length - 5);

              const nomeContato =
                prev?.nomeContato ?? i.nomeContato ?? i.contatoNome ?? "";
              const telefoneContato =
                prev?.telefoneContato ??
                i.telefoneContato ??
                i.contatoTelefone ??
                "";

              const copied = !!copiedById[i.id];

              return (
                <div
                  key={i.id}
                  className={[
                    card,
                    "p-7 transition-all",
                    "hover:bg-white/[0.045]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-2xl font-extrabold">
                        {i.titulo ?? "—"}
                      </div>
                      <div className="mt-1 text-sm text-white/55">
                        {(i.cidade ?? "—") + " • " + (i.bairro ?? "—")}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {situacaoToPill(i.situacao)}
                        {placaToPill(!!i.haPlaca)}
                        {isLoading && pill("neutral", "Carregando…")}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-black tracking-widest text-white/40">
                        VALOR
                      </div>
                      <div className="text-xl font-extrabold">
                        {moneyBRL(i.valor ?? 0)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-7">
                      <div className="relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                        <div className="aspect-[4/3] w-full">
                          {main ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={main}
                              alt="Foto do imóvel"
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-white/35">
                              {isLoading
                                ? "Carregando fotos…"
                                : "Sem foto cadastrada"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-5">
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, idx) => {
                          const t = thumbs[idx];
                          const isExtraBox = idx === 3 && extra > 0;

                          return (
                            <div
                              key={idx}
                              className="relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10"
                            >
                              <div className="aspect-square w-full">
                                {t ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={t}
                                    alt="Foto"
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-white/35">
                                    Foto
                                  </div>
                                )}
                              </div>

                              {isExtraBox && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-extrabold text-white">
                                  +{extra}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
                      <div className="text-[10px] font-black tracking-widest text-white/45">
                        CONTATO
                      </div>
                      <div className="mt-1 font-bold">
                        {nomeContato?.trim() ? nomeContato : "—"}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black tracking-widest text-white/45">
                          TELEFONE
                        </div>

                        <button
                          type="button"
                          title={copied ? "Copiado!" : "Copiar telefone"}
                          onClick={async () => {
                            await copyText(telefoneContato);
                            setCopiedById((p) => ({ ...p, [i.id]: true }));
                            window.setTimeout(() => {
                              setCopiedById((p) => ({ ...p, [i.id]: false }));
                            }, 1200);
                          }}
                          className={[
                            "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold",
                            "bg-white/6 hover:bg-white/10 ring-1 ring-white/10",
                            copied
                              ? "text-emerald-200 ring-emerald-400/30 shadow-[0_0_16px_rgba(16,185,129,0.12)]"
                              : "text-white/75",
                          ].join(" ")}
                        >
                          <CopyIcon />
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </div>

                      <div className="mt-2 font-bold">
                        {telefoneContato?.trim() ? telefoneContato : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-xs text-white/45">
                      {ordered.length} foto(s)
                    </div>

                    <div className="flex gap-2">
                      {admin ? (
                        <button
                          className={btnWarn}
                          onClick={() =>
                            router.push(`/imoveis/${i.id}/comprometer`)
                          }
                        >
                          Comprometer
                        </button>
                      ) : null}

                      <button
                        className={btnGhost}
                        onClick={() => router.push(`/imoveis/${i.id}`)}
                      >
                        Ver
                      </button>

                      <button
                        className={btnDanger}
                        onClick={() => abrirConfirmRemover(i.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   Filtragem (memo-friendly)
   ========================= */
function filteredImoveisMemo(
  imoveis: ImovelListItem[],
  search: string,
  placa: PlacaFilter,
  situacao: SituacaoFilter
) {
  const q = (search ?? "").trim().toLowerCase();

  function matchSearch(i: ImovelListItem) {
    if (!q) return true;
    const titulo = (i.titulo ?? "").toLowerCase();
    const cidade = (i.cidade ?? "").toLowerCase();
    const bairro = (i.bairro ?? "").toLowerCase();
    return titulo.includes(q) || cidade.includes(q) || bairro.includes(q);
  }

  function matchPlaca(i: ImovelListItem) {
    if (placa === "ALL") return true;
    if (placa === "COM") return !!i.haPlaca;
    return !i.haPlaca;
  }

  function matchSituacao(i: ImovelListItem) {
    if (situacao === "ALL") return true;
    const s = normalizeSituacao(i.situacao);
    if (situacao === "VENDER") return s === "PARA VENDER";
    if (situacao === "ALUGAR") return s === "PARA ALUGAR";
    return true;
  }

  return imoveis.filter((i) => matchSearch(i) && matchPlaca(i) && matchSituacao(i));
}
