// frontend/src/app/imoveis/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

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

  // não tenta mostrar caminho local do Windows como URL
  if (s.startsWith("file:")) return "";

  // padroniza barras
  s = s.replace(/\\/g, "/");

  // se já é absoluta, devolve
  if (/^https?:\/\//i.test(s)) return s;

  // tenta extrair o trecho /uploads/...
  const low = s.toLowerCase();
  const idx = low.indexOf("/uploads/");
  if (idx >= 0) return s.slice(idx);

  const idx2 = low.indexOf("uploads/");
  if (idx2 >= 0) return "/" + s.slice(idx2);

  // se vier só "nome.jpg" sem pasta, assume /uploads/nome.jpg
  if (!s.startsWith("/")) s = "/" + s;
  return s;
}

function getApiBase() {
  // prioridade: ENV pública do Next (mais confiável no browser)
  const envBase = (process.env.NEXT_PUBLIC_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (envBase) return envBase;

  // fallback: axios baseURL
  const axiosBase = (api.defaults.baseURL ?? "")
    .toString()
    .trim()
    .replace(/\/$/, "");
  return axiosBase;
}

/**
 * ✅ IMPORTANTE:
 * uploads NÃO está em /api/uploads, e sim em /uploads
 * então removemos "/api" do base quando for montar imagem
 */
function getUploadsBase() {
  const base = getApiBase().replace(/\/$/, "");
  if (!base) return "";
  // remove /api ou /api/
  return base.replace(/\/api\/?$/i, "");
}

function resolveImgUrl(url?: string) {
  const normalized = normalizePhotoPath(url);
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const base = getUploadsBase();
  if (!base) {
    // se não tiver base, cai no relativo (vai tentar no :3000)
    return normalized;
  }

  // garante que começa com /
  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${base}${path}`;
}

async function copyText(text: string) {
  const t = (text ?? "").toString().trim();
  if (!t) return;

  // Clipboard API
  try {
    await navigator.clipboard.writeText(t);
    return;
  } catch {}

  // fallback antigo
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

/** Segmented (switch premium) */
function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const base =
    "rounded-full px-3 py-1.5 text-[11px] font-black tracking-widest transition ring-1";
  const active =
    "bg-amber-300/12 text-amber-100 ring-amber-300/25 shadow-[0_0_18px_rgba(251,191,36,0.10)]";
  const normal = "bg-white/6 text-white/65 ring-white/10 hover:bg-white/8";

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-black/20 p-1 ring-1 ring-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`${base} ${value === o.value ? active : normal}`}
        >
          {o.label}
        </button>
      ))}
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

  // feedback de "copiado"
  const [copiedById, setCopiedById] = useState<Record<string, boolean>>({});

  const inflight = useRef<Set<string>>(new Set());

  // ✅ NOVO: busca + filtros
  const [q, setQ] = useState("");
  const [placaFilter, setPlacaFilter] = useState<"ALL" | "COM" | "SEM">("ALL");
  const [situacaoFilter, setSituacaoFilter] = useState<
    "ALL" | "VENDER" | "ALUGAR"
  >("ALL");

  async function carregarImoveis() {
    setLoading(true);
    try {
      const res = await api.get("/imoveis");
      const data: ImovelListItem[] = Array.isArray(res.data) ? res.data : [];
      setImoveis(data);
    } catch (e) {
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

  async function removerImovel(id: string) {
    if (!confirm("Deseja remover este imóvel?")) return;
    try {
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
    }
  }

  const total = imoveis.length;

  const somaValores = useMemo(() => {
    return imoveis.reduce((acc, i) => acc + asNumber(i.valor), 0);
  }, [imoveis]);

  // ✅ lista filtrada (busca por nome/título, cidade, bairro + filtros)
  const filteredImoveis = useMemo(() => {
    const term = q.trim().toLowerCase();

    return imoveis.filter((i) => {
      // placa
      if (placaFilter === "COM" && !i.haPlaca) return false;
      if (placaFilter === "SEM" && i.haPlaca) return false;

      // situação
      const sit = normalizeSituacao(i.situacao);
      if (situacaoFilter === "VENDER" && sit !== "PARA VENDER") return false;
      if (situacaoFilter === "ALUGAR" && sit !== "PARA ALUGAR") return false;

      // busca
      if (!term) return true;
      const hay = `${i.titulo ?? ""} ${i.cidade ?? ""} ${i.bairro ?? ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [imoveis, q, placaFilter, situacaoFilter]);

  // ✅ preload em cima da lista filtrada (quando modo prévia)
  useEffect(() => {
    if (!previewMode) return;
    if (filteredImoveis.length === 0) return;
    preloadAllPreviews(filteredImoveis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, filteredImoveis]);

  const btnBase =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] ring-1 ring-white/10 bg-white/5 hover:bg-white/8";
  const btnGold =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-extrabold tracking-wide transition-all duration-200 active:scale-[0.99] " +
    "bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/25 hover:bg-amber-300/14 " +
    "shadow-[0_0_0_1px_rgba(255,214,102,0.18),0_0_22px_rgba(255,214,102,0.10)]";
  const btnDanger =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold transition-all duration-200 active:scale-[0.99] " +
    "bg-rose-500/10 text-rose-100 ring-1 ring-rose-400/25 hover:bg-rose-500/14 " +
    "shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_18px_rgba(244,63,94,0.10)]";
  const btnGhost =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] " +
    "bg-white/4 text-white/85 ring-1 ring-white/10 hover:bg-white/7";

  const card =
    "rounded-3xl bg-white/[0.035] ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]";

  const searchInput =
    "w-[340px] max-w-full rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 " +
    "text-sm text-white/90 placeholder:text-white/25 outline-none " +
    "focus:border-white/18 focus:ring-2 focus:ring-amber-300/10";

  if (loading) {
    return (
      <div className="p-10 text-white/80">
        <div className={card + " p-6"}>Carregando…</div>
      </div>
    );
  }

  return (
    <div className="p-10 text-white">
      {/* HEADER */}
      <div className={card + " p-8"}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-4xl font-extrabold tracking-tight">Imóveis</h1>
            <p className="mt-1 text-white/65">
              Gerencie sua carteira de imóveis com visual moderno e rápido.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {pill("neutral", `Total: ${total}`)}
              {pill("neutral", `Soma valores: ${moneyBRL(somaValores)}`)}
              {pill("neutral", `Mostrando: ${filteredImoveis.length}`)}

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

            {/* ✅ BUSCA + FILTROS */}
            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              {/* Busca */}
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome, cidade ou bairro…"
                  className={searchInput}
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

              {/* Placa */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-widest text-white/45">
                  PLACA
                </span>
                <Segmented
                  value={placaFilter}
                  onChange={(v) => setPlacaFilter(v as any)}
                  options={[
                    { value: "ALL", label: "TODOS" },
                    { value: "COM", label: "COM PLACA" },
                    { value: "SEM", label: "SEM PLACA" },
                  ]}
                />
              </div>

              {/* Situação */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-widest text-white/45">
                  SITUAÇÃO
                </span>
                <Segmented
                  value={situacaoFilter}
                  onChange={(v) => setSituacaoFilter(v as any)}
                  options={[
                    { value: "ALL", label: "TODAS" },
                    { value: "VENDER", label: "VENDER" },
                    { value: "ALUGAR", label: "ALUGAR" },
                  ]}
                />
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
              <div className="col-span-5">TÍTULO</div>
              <div className="col-span-2">CIDADE</div>
              <div className="col-span-2">VALOR</div>
              <div className="col-span-1">PLACA</div>
              <div className="col-span-1">SITUAÇÃO</div>
              <div className="col-span-1 text-right">AÇÕES</div>
            </div>

            {filteredImoveis.map((i) => (
              <div
                key={i.id}
                className="grid grid-cols-12 items-center gap-0 border-b border-white/5 px-6 py-5 hover:bg-white/[0.03]"
              >
                <div className="col-span-5">
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

                <div className="col-span-1 flex justify-end gap-2">
                  <button
                    className={btnGhost}
                    onClick={() => router.push(`/imoveis/${i.id}`)}
                  >
                    Ver
                  </button>
                  <button
                    className={btnDanger}
                    onClick={() => removerImovel(i.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}

            {filteredImoveis.length === 0 ? (
              <div className="px-6 py-10 text-white/55">
                Nenhum imóvel encontrado para o filtro/pesquisa atual.
              </div>
            ) : null}
          </div>
        ) : (
          // ===== PRÉVIA (CARDS) =====
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredImoveis.map((i) => {
              const prev = previewCache[i.id];
              const isLoading = !!previewLoading[i.id];

              const fotos = (prev?.fotos?.length ? prev.fotos : i.fotos) ?? [];
              const ordered = [...fotos].sort(
                (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
              );

              const main = ordered[0]?.url ? resolveImgUrl(ordered[0].url) : "";
              const thumbs = ordered.slice(1, 5).map((f) => resolveImgUrl(f.url));
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
                  className={[card, "p-7 transition-all", "hover:bg-white/[0.045]"].join(" ")}
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
                              {isLoading ? "Carregando fotos…" : "Sem foto cadastrada"}
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
                      <button
                        className={btnGhost}
                        onClick={() => router.push(`/imoveis/${i.id}`)}
                      >
                        Ver
                      </button>
                      <button className={btnDanger} onClick={() => removerImovel(i.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredImoveis.length === 0 ? (
              <div className={card + " p-8 text-white/55"}>
                Nenhum imóvel encontrado para o filtro/pesquisa atual.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
