"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";
import { useRouter, useParams } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

export default function EditarUsuarioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔐 Apenas ADMIN
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/imoveis");
    }
  }, [user]);

  async function carregarUsuario() {
    try {
      setLoading(true);
      const res = await api.get(`/usuarios/${id}`);
      const u: User = res.data;

      setName(u.name);
      setEmail(u.email);
      setRole(u.role);
    } catch {
      setError("Erro ao carregar usuário");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setActionLoading(true);
      setError(null);
      setMessage(null);

      await api.put(`/usuarios/${id}`, {
        name,
        email,
        role,
        password: password || undefined
      });

      setMessage("Usuário atualizado com sucesso");

      setTimeout(() => {
        router.push("/usuarios");
      }, 1000);
    } catch {
      setError("Erro ao atualizar usuário");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    carregarUsuario();
  }, []);

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editar Corretor</h1>

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

      <form onSubmit={salvar} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <select
          className="w-full border p-2 rounded"
          value={role}
          onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
        >
          <option value="USER">Corretor</option>
          <option value="ADMIN">Administrador</option>
        </select>

        <input
          className="w-full border p-2 rounded"
          placeholder="Nova senha (opcional)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            disabled={actionLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {actionLoading ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/usuarios")}
            className="border px-4 py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
