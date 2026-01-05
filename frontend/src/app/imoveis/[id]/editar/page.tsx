"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";

export default function EditarImovelPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({
    titulo: "",
    cidade: "",
    bairro: "",
    endereco: "",
    cep: "",
    pontoReferencia: "",
    valor: "",
    status: "ATIVO",
    areaTerrenoTotal: "",
    areaConstruida: "",
    banheiros: "",
    dormitorios: "",
    garagens: "",
    descricao: "",
    situacao: "",
    chave: ""
  });

  // 🔹 BUSCAR IMÓVEL
  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get(`/imoveis/${id}`);
        setForm({
          ...res.data,
          valor: res.data.valor ?? "",
          areaTerrenoTotal: res.data.areaTerrenoTotal ?? "",
          areaConstruida: res.data.areaConstruida ?? "",
          banheiros: res.data.banheiros ?? "",
          dormitorios: res.data.dormitorios ?? "",
          garagens: res.data.garagens ?? ""
        });
      } catch {
        alert("Erro ao carregar imóvel");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id]);

  // 🔹 SALVAR
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api.put(`/imoveis/${id}`, form);
      router.push("/imoveis");
    } catch {
      alert("Erro ao salvar imóvel");
    }
  }

  if (loading) {
    return <p className="p-8 text-white">Carregando...</p>;
  }

  return (
    <div className="p-8 text-white max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Editar Imóvel</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="input"
          placeholder="Título"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        />

        <input
          className="input"
          placeholder="Cidade"
          value={form.cidade}
          onChange={(e) => setForm({ ...form, cidade: e.target.value })}
        />

        <input
          className="input"
          placeholder="Bairro"
          value={form.bairro}
          onChange={(e) => setForm({ ...form, bairro: e.target.value })}
        />

        <input
          className="input"
          placeholder="Endereço"
          value={form.endereco}
          onChange={(e) => setForm({ ...form, endereco: e.target.value })}
        />

        <input
          className="input"
          placeholder="CEP"
          value={form.cep}
          onChange={(e) => setForm({ ...form, cep: e.target.value })}
        />

        <input
          className="input"
          placeholder="Ponto de referência"
          value={form.pontoReferencia}
          onChange={(e) =>
            setForm({ ...form, pontoReferencia: e.target.value })
          }
        />

        <input
          type="number"
          className="input"
          placeholder="Valor"
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.target.value })}
        />

        <select
          className="input"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="ATIVO">Ativo</option>
          <option value="VENDIDO">Vendido</option>
          <option value="ALUGADO">Alugado</option>
        </select>

        <textarea
          className="input h-28"
          placeholder="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />

        <button
          type="submit"
          className="bg-green-600 px-6 py-2 rounded font-semibold"
        >
          Salvar alterações
        </button>
      </form>
    </div>
  );
}
