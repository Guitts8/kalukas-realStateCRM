"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

export default function CorretoresImovelPage() {
  const { id } = useParams(); // id do imóvel
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [associadosIds, setAssociadosIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function carregarDados() {
  try {
    setLoading(true);
    setError(null);

    // TODOS OS USUÁRIOS (ADMIN)
    const resUsuarios = await api.get("/users");

    // USUÁRIOS ASSOCIADOS AO IMÓVEL
    const resAssociados = await api.get(`/imoveis/${id}/usuarios`);

    setUsuarios(resUsuarios.data);
    setAssociadosIds(resAssociados.data.map((u: User) => u.id));
  } catch (err: any) {
    console.error("Erro ao carregar corretores:", err);

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }

    setError("Erro ao carregar corretores");
  } finally {
    setLoading(false);
  }
}



  async function associar(userId: string) {
    try {
      setActionLoading(userId);
      setError(null);
      setMessage(null);

      await api.post(`/imoveis/${id}/usuarios`, { userId });

      setMessage("Corretor associado com sucesso");
      carregarDados();
    } catch {
      setError("Erro ao associar corretor");
    } finally {
      setActionLoading(null);
    }
  }

  async function remover(userId: string) {
    try {
      setActionLoading(userId);
      setError(null);
      setMessage(null);

      await api.delete(`/imoveis/${id}/usuarios/${userId}`);

      setMessage("Corretor removido com sucesso");
      carregarDados();
    } catch {
      setError("Erro ao remover corretor");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Corretores do Imóvel</h1>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {usuarios
          .filter((u) => u.role === "USER")
          .map((u) => {
            const associado = associadosIds.includes(u.id);

            return (
              <div
                key={u.id}
                className="flex justify-between items-center border p-4 rounded"
              >
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>

                  {associado && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block">
                      Associado
                    </span>
                  )}
                </div>

                {/* BOTÕES (somente ADMIN) */}
                {user?.role === "ADMIN" && (
                  <div>
                    {!associado ? (
                      <button
                        onClick={() => associar(u.id)}
                        disabled={actionLoading === u.id}
                        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {actionLoading === u.id
                          ? "Associando..."
                          : "Associar"}
                      </button>
                    ) : (
                      <button
                        onClick={() => remover(u.id)}
                        disabled={actionLoading === u.id}
                        className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {actionLoading === u.id
                          ? "Removendo..."
                          : "Remover"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
