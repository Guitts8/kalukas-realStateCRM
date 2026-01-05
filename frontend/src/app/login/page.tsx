"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(email, password);
    router.push("/imoveis");
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 max-w-sm mx-auto">
      <h1 className="text-xl mb-4">Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border p-2 w-full mb-2"
      />

      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <button className="bg-black text-white p-2 w-full">
        Entrar
      </button>
    </form>
  );
}
