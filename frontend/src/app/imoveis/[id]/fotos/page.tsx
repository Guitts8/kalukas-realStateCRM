"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { SortableFoto } from "../../../../../components/SortableFoto";

type Foto = {
  id: string;
  url: string;
  ordem: number;
};

export default function GerenciarFotosPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [modoExcluir, setModoExcluir] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ======================
     CARREGAR FOTOS
  ====================== */
  async function carregarFotos() {
    try {
      const res = await api.get(`/imoveis/${id}`);
      const ordenadas = (res.data.fotos || []).sort(
        (a: Foto, b: Foto) => a.ordem - b.ordem
      );
      setFotos(ordenadas);
    } catch {
      alert("Erro ao carregar fotos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarFotos();
  }, []);

  /* ======================
     SELEÇÃO
  ====================== */
  function toggleSelecionada(fotoId: string) {
    setSelecionadas(prev =>
      prev.includes(fotoId)
        ? prev.filter(id => id !== fotoId)
        : [...prev, fotoId]
    );
  }

  function selecionarTodas() {
    if (selecionadas.length === fotos.length) {
      setSelecionadas([]);
    } else {
      setSelecionadas(fotos.map(f => f.id));
    }
  }

  /* ======================
     SALVAR ORDEM
  ====================== */
  async function salvarOrdem(novas: Foto[]) {
    try {
      setSaving(true);
      await api.put("/imoveis/fotos/reordenar", {
        fotos: novas.map((f, index) => ({
          id: f.id,
          ordem: index + 1,
        })),
      });
    } catch {
      alert("Erro ao salvar ordem");
    } finally {
      setSaving(false);
    }
  }

  /* ======================
     DRAG END
  ====================== */
  function onDragEnd(event: any) {
    if (modoExcluir) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFotos(prev => {
      const oldIndex = prev.findIndex(f => f.id === active.id);
      const newIndex = prev.findIndex(f => f.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const reordered = arrayMove(prev, oldIndex, newIndex);
      salvarOrdem(reordered);
      return reordered;
    });
  }

  /* ======================
     EXCLUIR
  ====================== */
  async function excluirSelecionadas() {
    if (selecionadas.length === 0) return;

    const confirmar = confirm(
      `Deseja excluir ${selecionadas.length} foto(s)?`
    );
    if (!confirmar) return;

    try {
      setSaving(true);

      await Promise.all(
        selecionadas.map(fotoId =>
          api.delete(`/imoveis/fotos/${fotoId}`)
        )
      );

      setSelecionadas([]);
      setModoExcluir(false);
      carregarFotos();
    } catch {
      alert("Erro ao excluir fotos");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-white">Carregando...</p>;
  }

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Fotos</h1>

        <button
          onClick={() => router.back()}
          className="text-blue-400"
        >
          ← Voltar
        </button>
      </div>

      {/* AÇÕES */}
      {user?.role === "ADMIN" && (
        <div className="flex flex-wrap gap-4 mb-6">
          {!modoExcluir ? (
            <button
              onClick={() => setModoExcluir(true)}
              className="bg-red-600 px-4 py-2 rounded font-semibold"
            >
              Excluir fotos
            </button>
          ) : (
            <>
              <button
                onClick={selecionarTodas}
                className="bg-blue-600 px-4 py-2 rounded font-semibold"
              >
                {selecionadas.length === fotos.length
                  ? "Desmarcar todas"
                  : "Selecionar todas"}
              </button>

              <button
                onClick={excluirSelecionadas}
                disabled={saving || selecionadas.length === 0}
                className="bg-red-700 px-4 py-2 rounded font-semibold disabled:opacity-50"
              >
                Excluir selecionadas ({selecionadas.length})
              </button>

              <button
                onClick={() => {
                  setModoExcluir(false);
                  setSelecionadas([]);
                }}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      )}

      {/* GRID */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={fotos.map(f => f.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {fotos.map(foto => (
              <SortableFoto
                key={foto.id}
                foto={foto}
                modoExcluir={modoExcluir}
                selecionada={selecionadas.includes(foto.id)}
                onToggle={() => toggleSelecionada(foto.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
