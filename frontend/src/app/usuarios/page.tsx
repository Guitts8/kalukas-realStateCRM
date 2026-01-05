"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔐 Proteção: apenas ADMIN
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/imoveis");
    }
  }, [user]);

  async function carregarUsuarios() {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsuarios(res.data);
    } catch {
      setError("Erro ao carregar corretores");
    } finally {
      setLoading(false);
    }
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    try {
      setActionLoading("create");
      setError(null);
      setMessage(null);

      await api.post("/users", {
        name,
        email,
        password
      });

      setMessage("Corretor cadastrado com sucesso");
      setName("");
      setEmail("");
      setPassword("");
      carregarUsuarios();
    } catch {
      setError("Erro ao cadastrar corretor");
    } finally {
      setActionLoading(null);
    }
  }

  async function remover(id: string) {
    if (!confirm("Deseja remover este corretor?")) return;

    try {
      setActionLoading(id);
      setError(null);
      setMessage(null);

      await api.delete(`/users/${id}`);
      setMessage("Corretor removido com sucesso");
      carregarUsuarios();
    } catch {
      setError("Erro ao remover corretor");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Corretores</h1>

      {/* MENSAGENS */}
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

      {/* FORMULÁRIO */}
      <form
        onSubmit={cadastrar}
        className="mb-8 p-4 border rounded space-y-3"
      >
        <h2 className="font-semibold">Cadastrar corretor</h2>

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

        <input
          className="w-full border p-2 rounded"
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={actionLoading === "create"}
          className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {actionLoading === "create"
            ? "Cadastrando..."
            : "Cadastrar"}
        </button>
      </form>

      {/* LISTAGEM */}
      <div className="space-y-3">
        {usuarios
          .filter((u) => u.role === "USER")
          .map((u) => (
            <div
              key={u.id}
              className="flex justify-between items-center border p-4 rounded"
            >
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>

              <button
                onClick={() => remover(u.id)}
                disabled={actionLoading === u.id}
                className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {actionLoading === u.id ? "Removendo..." : "Excluir"}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
