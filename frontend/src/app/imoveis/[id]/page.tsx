"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";

type Foto = {
  id: string;
  url: string;
};

export default function DetalheImovelPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [imovel, setImovel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="p-8 text-white">Carregando...</p>;
  }

  if (!imovel) {
    return <p className="p-8 text-red-500">Imóvel não encontrado</p>;
  }

  const fotos: Foto[] = imovel.fotos || [];

  const foto1 = fotos[0];
  const foto2 = fotos[1];
  const foto3 = fotos[2];
  const restantes = fotos.length - 3;

  function getFotoUrl(foto?: Foto) {
    if (!foto) return "";
    return foto.url.startsWith("http")
      ? foto.url
      : `http://localhost:3333${foto.url}`;
  }

  return (
    <div className="p-8 text-white max-w-7xl">
      {/* VOLTAR */}
      <button
        onClick={() => router.push("/imoveis")}
        className="text-blue-400 mb-6"
      >
        ← Voltar
      </button>

      <h1 className="text-3xl font-bold mb-8">{imovel.titulo}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* DADOS */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <Item label="Cidade" value={imovel.cidade} />
          <Item label="Bairro" value={imovel.bairro} />
          <Item label="Endereço" value={imovel.endereco} />
          <Item label="CEP" value={imovel.cep} />
          <Item label="Ponto de referência" value={imovel.pontoReferencia} />
          <Item label="Status" value={imovel.status} />
          <Item
            label="Valor"
            value={`R$ ${imovel.valor?.toLocaleString("pt-BR")}`}
          />
          <Item label="Área total (m²)" value={imovel.areaTerrenoTotal} />
          <Item label="Área construída (m²)" value={imovel.areaConstruida} />
          <Item label="Banheiros" value={imovel.banheiros} />
          <Item label="Dormitórios" value={imovel.dormitorios} />
          <Item label="Garagens" value={imovel.garagens} />
          <Item label="Situação" value={imovel.situacao} />
          <Item label="Chave" value={imovel.chave} />
        </div>

        {/* FOTOS */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Fotos do imóvel</h2>

          {fotos.length === 0 ? (
            <p className="text-gray-400 text-sm mb-4">
              Nenhuma foto cadastrada
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* FOTO 1 */}
              {foto1 && (
                <img
                  src={getFotoUrl(foto1)}
                  alt="Foto do imóvel"
                  className="w-full h-40 object-cover rounded"
                />
              )}

              {/* FOTO 2 */}
              {foto2 && (
                <img
                  src={getFotoUrl(foto2)}
                  alt="Foto do imóvel"
                  className="w-full h-40 object-cover rounded"
                />
              )}

              {/* FOTO 3 (embaixo esquerda) */}
              {foto3 && (
                <img
                  src={getFotoUrl(foto3)}
                  alt="Foto do imóvel"
                  className="w-full h-40 object-cover rounded"
                />
              )}

              {/* +N (embaixo direita) */}
              {restantes > 0 && (
                <div
                  onClick={() => router.push(`/imoveis/${id}/fotos`)}
                  className="flex items-center justify-center border border-dashed border-gray-500 rounded h-40 cursor-pointer hover:bg-gray-900"
                >
                  <span className="text-2xl font-bold">+{restantes}</span>
                </div>
              )}
            </div>
          )}

          {/* BOTÕES DE FOTO (ADMIN) */}
          {user?.role === "ADMIN" && (
  <div className="flex gap-4 mt-6">
    <button
  onClick={() => router.push(`/imoveis/${id}/fotos/adicionar`)}
  className="bg-green-600 px-4 py-2 rounded"
>
  Adicionar fotos
</button>

<button
  onClick={() => router.push(`/imoveis/${id}/fotos`)}
  className="bg-blue-600 px-4 py-2 rounded"
>
  Gerenciar fotos
</button>

  </div>
)}

        </div>
      </div>

      {/* DESCRIÇÃO */}
      {imovel.descricao && (
        <div className="mt-10">
          <p className="text-gray-400 mb-2">Descrição</p>
          <p className="border border-gray-700 p-4 rounded">
            {imovel.descricao}
          </p>
        </div>
      )}

      {/* AÇÕES */}
      <div className="mt-10 flex gap-4">
        {user?.role === "ADMIN" && (
          <button
            onClick={() => router.push(`/imoveis/${id}/editar`)}
            className="bg-yellow-500 text-black px-5 py-2 rounded font-semibold"
          >
            Editar
          </button>
        )}

        <button
          onClick={() => router.push(`/imoveis/${id}/corretores`)}
          className="bg-blue-600 px-5 py-2 rounded font-semibold"
        >
          Corretores
        </button>
      </div>
    </div>
  );
}

/* COMPONENTE AUXILIAR */
function Item({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p>{value || "-"}</p>
    </div>
  );
}
