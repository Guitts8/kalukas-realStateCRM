"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { api } from "@/services/api";

type Foto = {
  id: string;
  url: string;
};

type Props = {
  foto: Foto;
  ordemIndex: number;
  modoExcluir: boolean;
  selecionada: boolean;
  onToggle: () => void;
  onPreview: () => void; // abre com duplo clique
};

function normalizeFotoUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const apiBase = (api.defaults.baseURL || "").replace(/\/$/, "");
  const backendBase = apiBase.replace(/\/api$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${backendBase}${path}`;
}

export function SortableFoto({
  foto,
  ordemIndex,
  modoExcluir,
  selecionada,
  onToggle,
  onPreview,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: foto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl = useMemo(() => normalizeFotoUrl(foto.url), [foto.url]);

  // ✅ Se estiver no modo excluir, não liga drag listeners no card,
  // porque clique tem que selecionar.
  const dragProps = modoExcluir ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      onClick={modoExcluir ? onToggle : undefined}
      onDoubleClick={!modoExcluir ? onPreview : undefined}
      className={[
        "group relative rounded-2xl overflow-hidden border backdrop-blur select-none",
        "bg-white/[0.05] border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
        "transition",
        selecionada
          ? "ring-2 ring-red-400/25 border-red-400/30"
          : "hover:border-white/20",
        modoExcluir ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
      title={
        modoExcluir
          ? "Clique para selecionar"
          : "Arraste para reordenar • Duplo clique para visualizar"
      }
    >
      {/* imagem */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Foto do imóvel"
        draggable={false}
        className="w-full h-40 object-cover"
      />

      {/* overlay suave */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-90" />

      {/* topo: ordem */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
        <span className="inline-flex items-center px-2 py-1 rounded-full border border-white/10 bg-black/35 text-xs text-zinc-100">
          #{ordemIndex + 1}
        </span>

        {!modoExcluir && (
          <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full border border-white/10 bg-black/35 text-xs text-zinc-200">
          </span>
        )}
      </div>

      {/* checkbox no modo excluir */}
      {modoExcluir && (
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <div
            className={[
              "w-6 h-6 rounded-lg border flex items-center justify-center",
              selecionada
                ? "bg-red-500/25 border-red-400/40"
                : "bg-black/35 border-white/15",
            ].join(" ")}
          >
            {selecionada && (
              <span className="text-white text-sm font-extrabold">✓</span>
            )}
          </div>
        </div>
      )}

      {/* dica preview */}
      {!modoExcluir && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
          <span className="inline-flex items-center px-2 py-1 rounded-full border border-white/10 bg-black/35 text-xs text-zinc-100">
            Duplo clique para abrir
          </span>
        </div>
      )}
    </div>
  );
}
