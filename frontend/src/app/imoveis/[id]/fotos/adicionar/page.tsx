"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";

export default function AdicionarFotosPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  if (user?.role !== "ADMIN") {
    router.push(`/imoveis/${id}`);
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  }

  async function enviar() {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append("fotos", file));

    try {
      setLoading(true);
      await api.post(`/imoveis/${id}/fotos`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      router.push(`/imoveis/${id}`);
    } catch {
      alert("Erro ao enviar fotos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <button
        onClick={() => router.back()}
        className="text-blue-400 mb-6"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold mb-4">Adicionar Fotos</h1>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="mb-6"
      />

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {files.map((file, i) => (
            <img
              key={i}
              src={URL.createObjectURL(file)}
              className="rounded object-cover aspect-[4/3]"
            />
          ))}
        </div>
      )}

      <button
        onClick={enviar}
        disabled={loading}
        className="bg-green-600 px-2 py-2 rounded font-semibold disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Salvar fotos"}
      </button>
    </div>
  );
}
