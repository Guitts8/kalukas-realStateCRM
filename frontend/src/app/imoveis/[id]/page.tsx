// frontend/src/app/imoveis/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";

type ImovelFoto = {
  id: string;
  url: string;
  ordem: number;
};

type Imovel = {
  id: string;
  titulo: string;
  cidade: string;
  bairro?: string | null;

  endereco?: string | null;
  numeroEndereco?: string | null;
  cep?: string | null;
  pontoReferencia?: string | null;

  // ✅ variações possíveis do backend / versões antigas
  contatoNome?: string | null;
  contatoTelefone?: string | null;

  nomeContato?: string | null;
  telefoneContato?: string | null;

  contato?: string | null;
  telefone?: string | null;

  valor: number;

  areaTerrenoTotal?: number | null;
  areaConstruida?: number | null;

  banheiros?: number | null;
  dormitorios?: number | null;
  garagens?: number | null;

  descricao?: string | null;
  situacao?: "ALUGAR" | "VENDER" | "INATIVO" | string | null;
  chave?: string | null;

  haPlaca: boolean;

  fotos: ImovelFoto[];
};

function formatMoney(v: number | null | undefined) {
  if (v === null || v === undefined) return "-";
  try {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${v}`;
  }
}

function formatTelefone(raw?: string | null) {
  if (!raw) return "-";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return raw;
}

/**
 * ✅ Resolve URL das fotos:
 * - Se já é http(s) -> retorna como está
 * - Se é "uploads/x.jpg" -> vira "http://localhost:3333/uploads/x.jpg" (ou seu base)
 * - Se é "/uploads/x.jpg" -> prefixa no host do backend
 *
 * Importante: seu axios baseURL costuma ser algo como "http://localhost:3333/api"
 * então removemos o "/api" para servir estáticos no root.
 */
function resolveFotoUrl(input?: string | null) {
  if (!input) return "";

  const url = String(input).trim();
  if (!url) return "";

  // já absoluto
  if (/^https?:\/\//i.test(url)) return url;

  const axiosBase = (api?.defaults?.baseURL as string | undefined) || "";
  const envBase = process.env.NEXT_PUBLIC_API_URL || "";

  // Preferir ENV, senão axios base
  let base = (envBase || axiosBase || "").trim();

  // remove trailing /api (se existir)
  base = base.replace(/\/api\/?$/i, "");

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  if (!base) return normalizedPath;

  return `${base}${normalizedPath}`;
}

function tagSituacao(s?: string | null) {
  const v = (s || "").toUpperCase();
  if (v === "ALUGAR") return { text: "Para alugar", cls: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25" };
  if (v === "VENDER") return { text: "Para vender", cls: "bg-amber-500/15 text-amber-200 border-amber-500/25" };
  if (v === "INATIVO") return { text: "Inativo", cls: "bg-rose-500/15 text-rose-200 border-rose-500/25" };
  if (!v) return null;
  return { text: v, cls: "bg-white/10 text-white/80 border-white/15" };
}

function GlassCard({
  title,
  rightBadge,
  children,
  className = "",
}: {
  title?: string;
  rightBadge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[0_18px_60px_rgba(0,0,0,0.55)] " +
        className
      }
    >
      {(title || rightBadge) && (
        <div className="flex items-center justify-between px-5 pt-5">
          {title ? <h3 className="text-sm font-semibold text-white/90">{title}</h3> : <div />}
          {rightBadge ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
              {rightBadge}
            </span>
          ) : null}
        </div>
      )}
      <div className={title || rightBadge ? "px-5 pb-5 pt-4" : "p-5"}>{children}</div>
    </div>
  );
}

function FieldCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-white/55">{label}</div>
      <div className="mt-1 text-[15px] font-semibold text-white">{value}</div>
    </div>
  );
}

/** Viewer (setas, esc, loop infinito, zoom simples + miniaturas embaixo) */
function PhotoViewer({
  isOpen,
  images,
  startIndex,
  onClose,
}: {
  isOpen: boolean;
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return;
    setIdx(startIndex);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [isOpen, startIndex]);

  useEffect(() => {
    if (!isOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((v) => (v + 1) % images.length);
      if (e.key === "ArrowLeft") setIdx((v) => (v - 1 + images.length) % images.length);
      if (e.key.toLowerCase() === "r") {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-") setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  const current = images[idx];

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative mx-auto flex h-full w-full max-w-[1200px] flex-col px-4 py-4">
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="text-xs text-white/70">
            <span className="font-semibold text-white/90">
              {idx + 1}/{images.length}
            </span>
            <span className="mx-2">•</span>
            <span>Zoom {Math.round(zoom * 100)}%</span>
            <span className="mx-2">•</span>
            <span className="hidden sm:inline">←/→ navega • Esc fecha • Scroll +/- zoom • R reseta</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              Reset (R)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Fechar (Esc)
            </button>
          </div>
        </div>

        {/* Image stage */}
        <div className="relative z-10 mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/30">
          {/* arrows */}
          <button
            type="button"
            onClick={() => setIdx((v) => (v - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/10 p-3 text-white hover:bg-white/15"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIdx((v) => (v + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/10 p-3 text-white hover:bg-white/15"
          >
            ›
          </button>

          <img
            src={current}
            alt="Foto"
            className="select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: dragging.current ? "none" : "transform 120ms ease",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              cursor: zoom > 1 ? (dragging.current ? "grabbing" : "grab") : "zoom-in",
              userSelect: "none",
            }}
            draggable={false}
            onDoubleClick={() => {
              if (zoom === 1) setZoom(2);
              else {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }
            }}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.25 : 0.25;
              setZoom((z) => {
                const nz = Math.min(4, Math.max(1, +(z + delta).toFixed(2)));
                if (nz === 1) setPan({ x: 0, y: 0 });
                return nz;
              });
            }}
            onMouseDown={(e) => {
              if (zoom <= 1) return;
              dragging.current = true;
              last.current = { x: e.clientX, y: e.clientY };
            }}
            onMouseMove={(e) => {
              if (!dragging.current) return;
              const dx = e.clientX - last.current.x;
              const dy = e.clientY - last.current.y;
              last.current = { x: e.clientX, y: e.clientY };
              setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
            }}
            onMouseUp={() => (dragging.current = false)}
            onMouseLeave={() => (dragging.current = false)}
          />
        </div>

        {/* Thumbnails */}
        <div className="relative z-10 mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span className="font-semibold text-white/75">Miniaturas</span>
            <span className="hidden sm:inline">Clique para navegar</span>
          </div>

          <div
            className="flex gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3
                       [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, i) => {
              const active = i === idx;
              return (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={
                    "relative h-[64px] w-[88px] flex-none overflow-hidden rounded-xl border transition " +
                    (active
                      ? "border-amber-400/50 ring-2 ring-amber-400/30"
                      : "border-white/10 hover:border-white/20")
                  }
                >
                  <img src={src} alt={`Miniatura ${i + 1}`} className="h-full w-full object-cover" />
                  {active ? <div className="absolute inset-0 bg-amber-400/10" /> : <div className="absolute inset-0 bg-black/10" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImovelDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [imovel, setImovel] = useState<Imovel | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get(`/imoveis/${id}`);
        setImovel(res.data);
      } catch {
        alert("Erro ao carregar imóvel");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  const fotosOrdenadas = useMemo(() => {
    const list = imovel?.fotos ?? [];
    return [...list].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [imovel]);

  const fotosUrls = useMemo(() => fotosOrdenadas.map((f) => resolveFotoUrl(f.url)).filter(Boolean), [fotosOrdenadas]);

  const situacaoTag = tagSituacao(imovel?.situacao);

  const enderecoCompleto = useMemo(() => {
    const base = imovel?.endereco?.trim();
    const num = imovel?.numeroEndereco?.trim();
    if (!base && !num) return "-";
    if (base && num) return `${base}, ${num}`;
    return base || num || "-";
  }, [imovel?.endereco, imovel?.numeroEndereco]);

  // ✅ Fallback do contato/telefone (resolve todos os padrões)
  const contatoNome = useMemo(() => {
    const v =
      imovel?.nomeContato ??
      imovel?.contatoNome ??
      imovel?.contato ??
      null;

    const s = (v ?? "").toString().trim();
    return s || "-";
  }, [imovel]);

  const contatoTelefone = useMemo(() => {
    const v =
      imovel?.telefoneContato ??
      imovel?.contatoTelefone ??
      imovel?.telefone ??
      null;

    const s = (v ?? "").toString().trim();
    return s || "";
  }, [imovel]);

  // ✅ Botões com glow elegante
  const btnAmber =
    "rounded-xl border border-amber-400/25 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 " +
    "shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_12px_40px_rgba(251,191,36,0.10)] " +
    "hover:bg-amber-300/15 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_18px_70px_rgba(251,191,36,0.16)] " +
    "active:scale-[0.99] transition";

  const btnBlue =
    "rounded-xl border border-sky-400/25 bg-sky-300/10 px-4 py-2 text-sm font-semibold text-sky-100 " +
    "shadow-[0_0_0_1px_rgba(56,189,248,0.10),0_12px_40px_rgba(56,189,248,0.10)] " +
    "hover:bg-sky-300/15 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_18px_70px_rgba(56,189,248,0.16)] " +
    "active:scale-[0.99] transition";

  const btnNeutral =
    "rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 " +
    "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.35)] " +
    "hover:bg-white/8 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_18px_70px_rgba(0,0,0,0.45)] " +
    "active:scale-[0.99] transition";

  if (loading) return <p className="p-8 text-white/80">Carregando...</p>;
  if (!imovel) return <p className="p-8 text-white/80">Imóvel não encontrado.</p>;

  return (
    <div className="w-full px-6 py-6 text-white">
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Header */}
        <GlassCard className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push("/imoveis")}
                className="mb-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
              >
                ← Voltar
              </button>

              <h1 className="text-3xl font-extrabold tracking-tight">{imovel.titulo}</h1>
              <p className="mt-1 text-sm text-white/65">
                {imovel.cidade} <span className="mx-2">•</span> {imovel.bairro || "-"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {situacaoTag ? (
                  <span className={"rounded-full border px-3 py-1 text-xs font-semibold " + situacaoTag.cls}>
                    {situacaoTag.text}
                  </span>
                ) : null}

                {imovel.haPlaca ? (
                  <span className="rounded-full border border-amber-400/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                    Há placa
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                    Sem placa
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => router.push(`/imoveis/${imovel.id}/fotos/adicionar`)} className={btnAmber}>
                Adicionar fotos
              </button>

              <button type="button" onClick={() => router.push(`/imoveis/${imovel.id}/fotos`)} className={btnBlue}>
                Gerenciar fotos
              </button>

              <button type="button" onClick={() => router.push(`/imoveis/${imovel.id}/editar`)} className={btnNeutral}>
                Editar
              </button>

              <button type="button" onClick={() => router.push(`/imoveis/${imovel.id}/corretores`)} className={btnNeutral}>
                Corretores
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Body grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          {/* Left info */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldCard label="Cidade" value={imovel.cidade || "-"} />
              <FieldCard label="Bairro" value={imovel.bairro || "-"} />

              <FieldCard label="Endereço" value={enderecoCompleto} />
              <FieldCard label="CEP" value={imovel.cep || "-"} />

              <FieldCard label="Ponto de referência" value={imovel.pontoReferencia || "-"} />
              <FieldCard label="Valor" value={formatMoney(imovel.valor)} />

              <FieldCard label="Área total (m²)" value={imovel.areaTerrenoTotal ?? "-"} />
              <FieldCard label="Área construída (m²)" value={imovel.areaConstruida ?? "-"} />

              <FieldCard label="Banheiros" value={imovel.banheiros ?? "-"} />
              <FieldCard label="Dormitórios" value={imovel.dormitorios ?? "-"} />

              <FieldCard label="Garagens" value={imovel.garagens ?? "-"} />
              <FieldCard label="Chave" value={imovel.chave || "-"} />

              {/* ✅ agora funciona com qualquer nome vindo da API */}
              <FieldCard label="Contato" value={contatoNome} />
              <FieldCard label="Telefone" value={formatTelefone(contatoTelefone)} />
            </div>

            <GlassCard title="Descrição" rightBadge="Texto">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-white/90">
                {imovel.descricao || "-"}
              </div>
            </GlassCard>
          </div>

          {/* Right photos */}
          <GlassCard title="Fotos do imóvel" rightBadge={`${fotosOrdenadas.length} foto(s)`} className="h-fit">
            {fotosOrdenadas.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-6 text-center text-sm text-white/70">
                Nenhuma foto cadastrada.
              </div>
            ) : (
              <>
                {/* Main */}
                <button
                  type="button"
                  className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40"
                  onClick={() => {
                    setViewerIndex(0);
                    setViewerOpen(true);
                  }}
                >
                  <img
                    src={resolveFotoUrl(fotosOrdenadas[0].url)}
                    alt="Foto do imóvel"
                    className="h-[230px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
                </button>

                {/* thumbs grid */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {fotosOrdenadas.slice(1, 5).map((f, i) => (
                    <button
                      key={f.id}
                      type="button"
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40"
                      onClick={() => {
                        setViewerIndex(i + 1);
                        setViewerOpen(true);
                      }}
                    >
                      <img
                        src={resolveFotoUrl(f.url)}
                        alt="Foto"
                        className="h-[92px] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0" />
                    </button>
                  ))}
                </div>

                {/* +more */}
                {fotosOrdenadas.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setViewerIndex(0);
                      setViewerOpen(true);
                    }}
                    className="mt-4 w-full rounded-xl border border-dashed border-white/20 bg-white/[0.03] py-3 text-center text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
                  >
                    +{fotosOrdenadas.length - 5}
                  </button>
                ) : null}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => router.push(`/imoveis/${imovel.id}/fotos/adicionar`)} className={btnAmber}>
                    Adicionar fotos
                  </button>

                  <button type="button" onClick={() => router.push(`/imoveis/${imovel.id}/fotos`)} className={btnBlue}>
                    Gerenciar fotos
                  </button>
                </div>
              </>
            )}
          </GlassCard>
        </div>

        <PhotoViewer isOpen={viewerOpen} images={fotosUrls} startIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
      </div>
    </div>
  );
}
