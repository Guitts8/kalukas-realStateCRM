"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={[
        "relative h-9 w-16 rounded-full border transition",
        value
          ? "border-amber-300/30 bg-amber-300/15"
          : "border-white/15 bg-white/5",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white/8",
      ].join(" ")}
      aria-pressed={value}
    >
      <span
        className={[
          "absolute top-1 h-7 w-7 rounded-full transition shadow",
          value
            ? "left-8 bg-amber-200/90 shadow-[0_0_18px_rgba(251,191,36,0.22)]"
            : "left-1 bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.08)]",
        ].join(" ")}
      />
    </button>
  );
}

export default function NovoCorretorPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const headerCard =
    "rounded-3xl bg-white/[0.035] ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]";
  const inputBase =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/90 " +
    "placeholder:text-white/25 outline-none " +
    "focus:border-white/18 focus:ring-2 focus:ring-amber-300/10";
  const labelBase = "text-xs font-black tracking-widest text-white/45";

  const btnAmber =
    "rounded-xl border border-amber-400/25 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 " +
    "shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_12px_40px_rgba(251,191,36,0.10)] " +
    "hover:bg-amber-300/15 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_18px_70px_rgba(251,191,36,0.16)] " +
    "active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed";

  const btnNeutral =
    "rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 " +
    "hover:bg-white/8 active:scale-[0.99] transition";

  async function salvar() {
    if (!name.trim()) return setError("Informe o nome.");
    if (!email.trim()) return setError("Informe o email.");
    if (!password.trim()) return setError("Informe a senha.");

    try {
      setSaving(true);
      setError(null);

      await api.post("/users", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        isAdmin,
      });

      router.push("/corretores");
    } catch {
      setError("Erro ao cadastrar corretor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[820px] space-y-6">
      <div className={`${headerCard} p-8`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Novo corretor</h1>
            <p className="mt-2 text-white/55">
              Cadastre um corretor e defina se ele terá permissão de administrador.
            </p>
          </div>
          <button className={btnNeutral} onClick={() => router.push("/corretores")}>
            Voltar
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-rose-100 ring-1 ring-rose-300/10">
          {error}
        </div>
      ) : null}

      <div className={`${headerCard} p-8 space-y-5`}>
        <div>
          <div className={labelBase}>NOME</div>
          <input
            className={inputBase}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: João da Silva"
          />
        </div>

        <div>
          <div className={labelBase}>EMAIL</div>
          <input
            className={inputBase}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex.: joao@imobiliaria.com"
            type="email"
          />
        </div>

        <div>
          <div className={labelBase}>SENHA</div>
          <input
            className={inputBase}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Defina uma senha"
            type="password"
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-5 ring-1 ring-white/10">
          <div>
            <div className="text-sm font-extrabold">É administrador</div>
            <div className="mt-1 text-xs text-white/50">
              Administradores acessam recursos restritos e configurações.
            </div>
          </div>
          <Toggle value={isAdmin} onChange={setIsAdmin} disabled={saving} />
        </div>

        <div className="flex gap-3 justify-end">
          <button className={btnNeutral} onClick={() => router.push("/corretores")}>
            Cancelar
          </button>
          <button className={btnAmber} disabled={saving} onClick={salvar}>
            {saving ? "Salvando…" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
