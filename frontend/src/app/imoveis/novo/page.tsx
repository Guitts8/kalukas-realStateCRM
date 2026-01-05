"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";

export default function NovoImovelPage() {
  const router = useRouter();
  const inputClass =
  "w-full bg-black border border-gray-600 text-white px-3 py-2 rounded focus:outline-none focus:border-white";


  const [form, setForm] = useState({
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/imoveis", form);
    router.push("/imoveis");
  }

  return (
    <div className="max-w-3xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Novo Imóvel</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
  <input name="titulo" placeholder="Título" onChange={handleChange} className={inputClass} />

  <input name="cidade" placeholder="Cidade" onChange={handleChange} className={inputClass} />

  <input name="bairro" placeholder="Bairro" onChange={handleChange} className={inputClass} />

  <input name="endereco" placeholder="Endereço" onChange={handleChange} className={inputClass} />

  <input name="cep" placeholder="CEP" onChange={handleChange} className={inputClass} />

  <input
    name="pontoReferencia"
    placeholder="Ponto de referência"
    onChange={handleChange}
    className={inputClass}
  />

  <input name="valor" placeholder="Valor" onChange={handleChange} className={inputClass} />

  <select name="status" onChange={handleChange} className={inputClass}>
    <option value="ATIVO">Ativo</option>
    <option value="VENDIDO">Vendido</option>
    <option value="ALUGADO">Alugado</option>
  </select>

  <input
    name="areaTerrenoTotal"
    placeholder="Área total (m²)"
    onChange={handleChange}
    className={inputClass}
  />

  <input
    name="areaConstruida"
    placeholder="Área construída (m²)"
    onChange={handleChange}
    className={inputClass}
  />

  <input name="banheiros" placeholder="Banheiros" onChange={handleChange} className={inputClass} />

  <input
    name="dormitorios"
    placeholder="Dormitórios"
    onChange={handleChange}
    className={inputClass}
  />

  <input name="garagens" placeholder="Garagens" onChange={handleChange} className={inputClass} />

  <textarea
    name="descricao"
    placeholder="Descrição do imóvel"
    onChange={handleChange}
    className={`${inputClass} h-32`}
  />

  <button className="bg-green-600 hover:bg-green-700 transition py-2 rounded font-semibold">
    Salvar
  </button>
</form>

    </div>
  );
}
