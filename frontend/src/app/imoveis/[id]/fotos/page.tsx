"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";
import { isAdmin } from "@/services/auth"; // ✅ NOVO

import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";

import { SortableFoto } from "../../../../../components/SortableFoto";

type Foto = {
  id: string;
  url: string;
  ordem: number;
};

function normalizeFotoUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const apiBase = (api.defaults.baseURL || "").replace(/\/$/, "");
  const backendBase = apiBase.replace(/\/api$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${backendBase}${path}`;
}

/* =========================
   UI (glass premium)
   ========================= */
const ui = {
  page: "p-6 text-white max-w-6xl mx-auto",
  card:
    "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_18px_60px_rgba(0,0,0,0.35)]",
  btnBase:
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition focus:outline-none focus:ring-2 focus:ring-white/15 border backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed",
  btnGlass:
    "bg-white/[0.06] hover:bg-white/[0.09] border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
  btnGlassSoft:
    "bg-white/[0.04] hover:bg-white/[0.07] border-white/10 text-white",
  btnAmberPremium:
    "bg-amber-300/10 hover:bg-amber-300/14 border-amber-200/20 text-amber-100 shadow-[0_12px_38px_rgba(245,158,11,0.16)] ring-1 ring-amber-200/10",
  btnDanger:
    "bg-red-500/10 hover:bg-red-500/14 border-red-500/25 text-red-100 shadow-[0_12px_38px_rgba(239,68,68,0.14)] ring-1 ring-red-200/10",
  pill:
    "inline-flex items-center px-3 py-1 rounded-full border text-xs backdrop-blur bg-white/5 border-white/10 text-zinc-200",
  pillOk:
    "inline-flex items-center px-3 py-1 rounded-full border text-xs backdrop-blur bg-emerald-500/10 border-emerald-500/25 text-emerald-100",
  pillWarn:
    "inline-flex items-center px-3 py-1 rounded-full border text-xs backdrop-blur bg-amber-500/10 border-amber-400/25 text-amber-100",
};

/* =========================
   Lightbox simples
   ========================= */
function Lightbox({
  fotos,
  startIndex,
  onClose,
}: {
  fotos: Foto[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  const total = fotos.length;
  const current = fotos[idx];

  function goTo(i: number) {
    const next = ((i % total) + total) % total;
    setIdx(next);
  }
  function prev() {
    goTo(idx - 1);
  }
  function next() {
    goTo(idx + 1);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    const wrap = thumbsRef.current;
    if (!wrap) return;

    const el = wrap.querySelector(`[data-thumb="${idx}"]`) as HTMLElement | null;
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [idx]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center"
      onClick={onClose}
    >
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="text-sm text-zinc-300">
            {idx + 1} / {total}
            <span className="ml-3 text-zinc-500">• ←/→ navega • Esc fecha</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`${ui.btnBase} ${ui.btnGlassSoft} px-3 py-1`}
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            >
              ←
            </button>
            <button
              className={`${ui.btnBase} ${ui.btnGlassSoft} px-3 py-1`}
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            >
              →
            </button>
            <button
              className={`${ui.btnBase} ${ui.btnGlassSoft} px-3 py-1`}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              Fechar (Esc)
            </button>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/8 hover:bg-white/12 border border-white/10 flex items-center justify-center text-xl backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            title="Anterior (←)"
          >
            ‹
          </button>

          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/8 hover:bg-white/12 border border-white/10 flex items-center justify-center text-xl backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            title="Próxima (→)"
          >
            ›
          </button>

          <div className="w-full h-[68vh] flex items-center justify-center select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizeFotoUrl(current.url)}
              alt="Foto do imóvel"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-zinc-300 font-semibold">Miniaturas</div>
            <div className="text-xs text-zinc-500">Clique para navegar</div>
          </div>

          <div ref={thumbsRef} className="no-scrollbar flex gap-3 overflow-x-auto">
            {fotos.map((f, i) => {
              const active = i === idx;
              return (
                <button
                  key={f.id}
                  data-thumb={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdx(i);
                  }}
                  className={`shrink-0 rounded-xl overflow-hidden border transition ${
                    active
                      ? "border-amber-200/60 ring-2 ring-amber-200/20"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizeFotoUrl(f.url)}
                    alt={`Miniatura ${i + 1}`}
                    className={`w-24 h-16 object-cover ${
                      active ? "opacity-100" : "opacity-80 hover:opacity-100"
                    }`}
                    draggable={false}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GerenciarFotosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // ✅ Admin derivado do seu auth.ts (storage/user/jwt)
  const admin = useMemo(() => isAdmin(), [user]); // ✅ NOVO

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [modoExcluir, setModoExcluir] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // ✅ trava/fila para não salvar em paralelo (evita 500 por corrida)
  const savingRef = useRef(false);
  const pendingRef = useRef<Foto[] | null>(null);

  const ordenadas = useMemo(() => fotos, [fotos]);

  function reindex(list: Foto[]) {
    return list.map((f, i) => ({ ...f, ordem: i + 1 }));
  }

  async function carregarFotos() {
    try {
      setLoading(true);
      const res = await api.get(`/imoveis/${id}`);

      const list: Foto[] = Array.isArray(res.data?.fotos) ? res.data.fotos.slice() : [];

      list.sort((a, b) => (a?.ordem ?? 0) - (b?.ordem ?? 0));

      const sane = list.filter((f) => f && typeof f.id === "string" && f.id.trim());
      setFotos(reindex(sane));
    } catch {
      alert("Erro ao carregar fotos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarFotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function toggleSelecionada(fotoId: string) {
    setSelecionadas((prev) =>
      prev.includes(fotoId) ? prev.filter((x) => x !== fotoId) : [...prev, fotoId]
    );
  }

  function selecionarTodas() {
    if (selecionadas.length === ordenadas.length) setSelecionadas([]);
    else setSelecionadas(ordenadas.map((f) => f.id));
  }

  async function salvarOrdem(novas: Foto[]) {
    const payload = novas
      .filter((f) => f && typeof f.id === "string" && f.id.trim())
      .map((f, idx) => ({
        id: f.id,
        ordem: idx + 1,
      }));

    if (payload.length === 0) return;

    if (savingRef.current) {
      pendingRef.current = novas;
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await api.put("/imoveis/fotos/reordenar", { fotos: payload });
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar ordem");
      await carregarFotos();
    } finally {
      setSaving(false);
      savingRef.current = false;

      if (pendingRef.current) {
        const last = pendingRef.current;
        pendingRef.current = null;
        salvarOrdem(last);
      }
    }
  }

  function onDragEnd(event: any) {
    if (modoExcluir) return;

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    setFotos((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === activeId);
      const newIndex = prev.findIndex((f) => f.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const moved = arrayMove(prev, oldIndex, newIndex);
      const updated = reindex(moved);

      salvarOrdem(updated);

      return updated;
    });
  }

  async function excluirSelecionadas() {
    if (selecionadas.length === 0) return;

    const confirmar = confirm(`Deseja excluir ${selecionadas.length} foto(s)?`);
    if (!confirmar) return;

    try {
      setSaving(true);
      await Promise.all(selecionadas.map((fotoId) => api.delete(`/imoveis/fotos/${fotoId}`)));

      setSelecionadas([]);
      setModoExcluir(false);
      carregarFotos();
    } catch {
      alert("Erro ao excluir fotos");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-white">Carregando...</p>;

  return (
    <div className={ui.page}>
      <div className={`${ui.card} p-6 mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Gerenciar fotos</h1>
            <div className="mt-1 text-sm text-zinc-300">
              Arraste pelo ícone para reordenar • Duplo clique para visualizar
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={ui.pill}>{ordenadas.length} foto(s)</span>

              {saving ? (
                <span className={ui.pillWarn}>Salvando alterações...</span>
              ) : (
                <span className={ui.pillOk}>Tudo salvo</span>
              )}

              {modoExcluir && (
                <span className="inline-flex items-center px-3 py-1 rounded-full border text-xs backdrop-blur bg-red-500/10 border-red-500/25 text-red-100">
                  Modo excluir ativo
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push(`/imoveis/${id}/fotos/adicionar`)}
              className={`${ui.btnBase} ${ui.btnAmberPremium}`}
            >
              Adicionar fotos
            </button>

            <button onClick={() => router.back()} className={`${ui.btnBase} ${ui.btnGlass}`}>
              ← Voltar
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Ações (Admin) agora usa isAdmin() */}
      {admin && (
        <div className={`${ui.card} p-5 mb-6`}>
          {!modoExcluir ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="font-semibold">Ações</div>
                <div className="text-sm text-zinc-300">
                  Ative o modo excluir para selecionar várias fotos.
                </div>
              </div>

              <button onClick={() => setModoExcluir(true)} className={`${ui.btnBase} ${ui.btnDanger}`}>
                Excluir fotos
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="font-semibold">Excluir em massa</div>
                <div className="text-sm text-zinc-300">
                  Clique nas fotos para selecionar. Depois confirme a exclusão.
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  Selecionadas:{" "}
                  <span className="font-extrabold text-white">{selecionadas.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={selecionarTodas} className={`${ui.btnBase} ${ui.btnGlass}`}>
                  {selecionadas.length === ordenadas.length ? "Desmarcar todas" : "Selecionar todas"}
                </button>

                <button
                  onClick={excluirSelecionadas}
                  disabled={saving || selecionadas.length === 0}
                  className={`${ui.btnBase} ${ui.btnDanger}`}
                >
                  Excluir selecionadas ({selecionadas.length})
                </button>

                <button
                  onClick={() => {
                    setModoExcluir(false);
                    setSelecionadas([]);
                  }}
                  className={`${ui.btnBase} ${ui.btnGlassSoft}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid + DnD */}
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ordenadas.map((f) => f.id)} strategy={rectSortingStrategy}>
          {ordenadas.length === 0 ? (
            <div className={`${ui.card} p-6 text-zinc-200`}>Nenhuma foto adicionada ainda.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ordenadas.map((foto, index) => (
                <SortableFoto
                  key={foto.id}
                  foto={foto}
                  ordemIndex={index}
                  modoExcluir={modoExcluir}
                  selecionada={selecionadas.includes(foto.id)}
                  onToggle={() => toggleSelecionada(foto.id)}
                  onPreview={() => setPreviewIndex(index)}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>

      {/* Preview modal */}
      {previewIndex !== null && ordenadas.length > 0 && (
        <Lightbox fotos={ordenadas} startIndex={previewIndex} onClose={() => setPreviewIndex(null)} />
      )}
    </div>
  );
}
