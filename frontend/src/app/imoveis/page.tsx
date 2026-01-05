"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";

type Imovel = {
  id: string;
  titulo: string;
  cidade: string;
  valor: number;
  ativo: boolean;
};

export default function ImoveisPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarImoveis() {
    try {
      const res = await api.get("/imoveis");
      setImoveis(res.data);
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function removerImovel(id: string) {
    const confirmar = confirm(
      "Tem certeza que deseja remover este imóvel?\nEssa ação não pode ser desfeita."
    );

    if (!confirmar) return;

    try {
      await api.delete(`/imoveis/${id}`);
      alert("Imóvel removido com sucesso");
      carregarImoveis();
    } catch (err) {
      alert("Erro ao remover imóvel");
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    carregarImoveis();
  }, [user]);

  if (loading) {
    return <p className="p-4">Carregando imóveis...</p>;
  }

  return (
    <div className="p-6">
      <header className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Imóveis</h1>

        <div className="flex gap-4">
          {user?.role === "ADMIN" && (
            <button
              onClick={() => router.push("/imoveis/novo")}
              className="bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Novo Imóvel
            </button>
          )}

          <button
            onClick={logout}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            Sair
          </button>
        </div>
      </header>

      {imoveis.length === 0 ? (
        <p>Nenhum imóvel cadastrado.</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-500">
            <tr>
              <th className="border p-2 text-left">Título</th>
              <th className="border p-2 text-left">Cidade</th>
              <th className="border p-2">Valor</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {imoveis.map((imovel) => (
              <tr key={imovel.id}>
                <td className="border p-2">{imovel.titulo}</td>
                <td className="border p-2">{imovel.cidade}</td>
                <td className="border p-2 text-center">
                  R$ {imovel.valor.toLocaleString("pt-BR")}
                </td>
                <td className="border p-2 text-center">
                  {imovel.ativo ? "Ativo" : "Inativo"}
                </td>
                <td className="border p-2 text-center">
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => router.push(`/imoveis/${imovel.id}`)}
                      className="text-yellow-600 hover:underline"
                    >
                      Ver
                    </button>

                    {user?.role === "ADMIN" && (
                      <button
                        onClick={() => removerImovel(imovel.id)}
                        className="text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
