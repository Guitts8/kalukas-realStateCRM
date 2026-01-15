// frontend/src/app/imoveis/[id]/fotos/adicionar/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

type LocalPreview = {
  file: File;
  url: string; // objectURL
  name: string;
  size: number;
};

function GlassCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] " +
        "shadow-[0_18px_60px_rgba(0,0,0,0.55)] " +
        className
      }
    >
      {(title || subtitle || right) && (
        <div className="flex flex-col gap-3 px-6 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-lg font-bold text-white/95">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-white/60">{subtitle}</p>
            ) : null}
          </div>
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
      )}
      <div className={(title || subtitle || right) ? "px-6 pb-6 pt-4" : "p-6"}>
        {children}
      </div>
    </div>
  );
}

export default function AdicionarFotosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ✅ previews locais (objectURL)
  const [localPreviews, setLocalPreviews] = useState<LocalPreview[]>([]);

  useEffect(() => {
    // limpa URLs antigas
    setLocalPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });

    if (!files.length) return;

    const next: LocalPreview[] = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
    }));

    setLocalPreviews(next);

    // cleanup final (quando trocar files ou desmontar)
    return () => {
      next.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [files]);

  const fileLabel = useMemo(() => {
    if (!files.length) return "Nenhum arquivo selecionado";
    if (files.length === 1) return files[0].name;
    return `${files.length} arquivos selecionados`;
  }, [files]);

  const btnAmber =
    "rounded-xl border border-amber-400/25 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 " +
    "shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_12px_40px_rgba(251,191,36,0.10)] " +
    "hover:bg-amber-300/15 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_18px_70px_rgba(251,191,36,0.16)] " +
    "active:scale-[0.99] transition";

  const btnNeutral =
    "rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 " +
    "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.35)] " +
    "hover:bg-white/8 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_18px_70px_rgba(0,0,0,0.45)] " +
    "active:scale-[0.99] transition";

  const btnBack =
    "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold " +
    "text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_30px_rgba(0,0,0,0.35)] " +
    "hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_16px_55px_rgba(0,0,0,0.45)] " +
    "active:scale-[0.99] transition";

  function setFilesLimited(next: File[]) {
    // mantém no máximo 25
    setFiles(next.slice(0, 25));
  }

  async function handleSalvar() {
    if (!files.length) {
      alert("Selecione pelo menos uma imagem.");
      return;
    }

    const formData = new FormData();
    for (const f of files) formData.append("fotos", f);

    try {
      setSaving(true);
      await api.post(`/imoveis/${id}/fotos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // limpa e volta
      setFiles([]);
      router.push(`/imoveis/${id}`);
    } catch {
      alert("Erro ao salvar fotos");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full px-6 py-6 text-white">
      {/* ✅ centraliza igual as outras telas */}
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Header padrão */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push(`/imoveis/${id}`)}
            className={btnBack}
          >
            ← Voltar
          </button>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
            Adicionar Fotos
          </h1>
          <p className="mt-1 text-sm text-white/65">
            Envie as imagens do imóvel (várias de uma vez).
          </p>
        </div>

        <GlassCard
          title="Selecione as fotos do imóvel"
          subtitle="Você pode selecionar várias imagens de uma vez (até 25). Formatos: JPG, PNG, WEBP."
          right={
            <>
              <button
                type="button"
                className={btnNeutral}
                onClick={() => router.push(`/imoveis/${id}`)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={btnAmber}
                onClick={handleSalvar}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar fotos"}
              </button>
            </>
          }
        >
          {/* Dropzone */}
          <label
            className={
              "block cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6 " +
              "transition " +
              (dragOver ? "bg-white/[0.08] border-white/35" : "hover:bg-white/[0.06]")
            }
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
              const dropped = Array.from(e.dataTransfer.files || []).filter((f) =>
                f.type.startsWith("image/")
              );
              if (!dropped.length) return;
              setFilesLimited(dropped);
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-base font-semibold text-white/90">
                  Clique para escolher arquivos
                </div>
                <div className="text-sm text-white/60">
                  Recomendado: imagens na horizontal. (Você também pode arrastar e soltar aqui.)
                </div>
              </div>

              <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/70 sm:mt-0">
                {fileLabel}
              </div>
            </div>

            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files || []).filter((f) =>
                  f.type.startsWith("image/")
                );
                setFilesLimited(list);
              }}
            />
          </label>

          {/* Lista simples (útil) */}
          {files.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="mb-2 text-sm font-semibold text-white/85">
                Arquivos selecionados
              </div>
              <ul className="space-y-1 text-sm text-white/70">
                {files.slice(0, 10).map((f) => (
                  <li key={f.name} className="flex items-center justify-between gap-4">
                    <span className="truncate">{f.name}</span>
                    <span className="text-white/50">{formatBytes(f.size)}</span>
                  </li>
                ))}
              </ul>
              {files.length > 10 ? (
                <div className="mt-2 text-xs text-white/50">
                  + {files.length - 10} arquivo(s)
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ✅ PRÉVIA DAS IMAGENS (voltou!) */}
          {localPreviews.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="mb-3 text-sm font-semibold text-white/85">
                Prévia das fotos
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {localPreviews.map((p) => (
                  <div
                    key={p.url}
                    className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10"
                    title={`${p.name} • ${formatBytes(p.size)}`}
                  >
                    <div className="aspect-square w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div className="p-2">
                      <div className="truncate text-xs font-bold text-white/85">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-white/55">
                        {formatBytes(p.size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
