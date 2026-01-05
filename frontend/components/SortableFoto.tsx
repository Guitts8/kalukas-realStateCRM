"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Foto = {
  id: string;
  url: string;
};

type Props = {
  foto: Foto;
  modoExcluir: boolean;
  selecionada: boolean;
  onToggle: () => void;
};

export function SortableFoto({
  foto,
  modoExcluir,
  selecionada,
  onToggle,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: foto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl = foto.url.startsWith("http")
    ? foto.url
    : `http://localhost:3333${foto.url}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!modoExcluir ? listeners : {})}
      onClick={modoExcluir ? onToggle : undefined}
      className={`
        relative rounded overflow-hidden border cursor-pointer
        ${selecionada ? "border-red-600" : "border-gray-700"}
        ${modoExcluir ? "hover:opacity-80" : ""}
      `}
    >
      {/* CHECKBOX */}
      {modoExcluir && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`
              w-5 h-5 rounded border flex items-center justify-center
              ${selecionada ? "bg-red-600 border-red-600" : "bg-white"}
            `}
          >
            {selecionada && (
              <span className="text-white text-sm font-bold">✓</span>
            )}
          </div>
        </div>
      )}

      {/* IMAGEM */}
      <img
        src={imageUrl}
        alt="Foto do imóvel"
        draggable={false}
        className="w-full h-40 object-cover select-none"
      />
    </div>
  );
}
