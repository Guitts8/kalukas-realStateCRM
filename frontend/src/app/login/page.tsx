// frontend/src/app/login/page.tsx
"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";

function getRedirectTarget(searchParams: ReturnType<typeof useSearchParams>) {
  const next = searchParams.get("next");
  if (!next) return "/imoveis";
  // evita redirect estranho
  if (!next.startsWith("/")) return "/imoveis";
  return next;
}

function pickToken(data: any): string {
  return (
    data?.token ||
    data?.accessToken ||
    data?.authToken ||
    data?.jwt ||
    data?.data?.token ||
    ""
  );
}

function pickRole(data: any): string {
  const user = data?.user || data?.usuario || data?.data?.user || data?.data?.usuario;
  return (
    user?.role ||
    user?.perfil ||
    data?.role ||
    data?.perfil ||
    ""
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const redirectTo = useMemo(() => getRedirectTarget(searchParams), [searchParams]);

  const ui = {
    page:
      "min-h-screen w-full bg-black text-white relative overflow-hidden",
    // fundo premium igual ao resto do sistema
    bg:
      "absolute inset-0 " +
      "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_55%)," +
      "radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.08),transparent_38%)," +
      "radial-gradient(circle_at_80%_30%,rgba(255,0,255,0.07),transparent_38%)," +
      "linear-gradient(180deg,#0f0f12,#0b0b0d)]",

    vignette:
      "absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.78)_100%)]",

    wrap: "relative z-10 min-h-screen flex items-center justify-center px-6 py-10",

    card:
      "w-full max-w-[430px] rounded-3xl " +
      "bg-white/[0.045] ring-1 ring-white/10 backdrop-blur-xl " +
      "shadow-[0_20px_70px_rgba(0,0,0,0.55)] p-7",

    title: "text-3xl font-extrabold tracking-tight",
    sub: "mt-1 text-sm text-white/60",

    label: "text-xs font-black tracking-widest text-white/50",
    input:
      "mt-2 w-full rounded-2xl bg-black/30 ring-1 ring-white/10 " +
      "px-4 py-3 text-white/90 placeholder:text-white/35 " +
      "focus:outline-none focus:ring-2 focus:ring-amber-200/25",

    btnPrimary:
      "w-full mt-4 rounded-2xl px-4 py-3 font-extrabold tracking-wide transition " +
      "bg-amber-300/12 text-amber-100 ring-1 ring-amber-200/20 " +
      "hover:bg-amber-300/16 active:scale-[0.99] " +
      "shadow-[0_0_0_1px_rgba(255,214,102,0.16),0_18px_60px_rgba(255,214,102,0.08)]",

    btnGhost:
      "w-full mt-3 rounded-2xl px-4 py-3 font-semibold transition " +
      "bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/8 active:scale-[0.99]",

    error:
      "mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 " +
      "px-4 py-3 text-sm text-rose-100",
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const em = email.trim();
    const pw = password.trim();

    if (!em || !pw) {
      setErrorMsg("Informe e-mail e senha.");
      return;
    }

    try {
      setLoading(true);

      // ✅ envia "password" e "senha" pra cobrir ambos os padrões
      const res = await api.post("/auth/login", {
        email: em,
        password: pw,
        senha: pw,
      });

      const data = res.data ?? {};
      const token = pickToken(data);

      if (!token) {
        setErrorMsg("Login não retornou token. Verifique o backend (/auth/login).");
        return;
      }

      // ✅ salva em chaves comuns (seu AppShell/ProtectedShell procura token)
      localStorage.setItem("token", token);

      // se vier role/perfil, salva também (ajuda em checks simples)
      const role = pickRole(data);
      if (role) localStorage.setItem("role", String(role));

      // se vier user, salva (opcional)
      const userObj = data?.user || data?.usuario || data?.data?.user || data?.data?.usuario;
      if (userObj) localStorage.setItem("user", JSON.stringify(userObj));

      router.replace(redirectTo);
    } catch (err: any) {
      // mensagem amigável
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Credenciais inválidas ou erro no servidor.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={ui.page}>
      <div className={ui.bg} />
      <div className={ui.vignette} />

      {/* ✅ LOGO NO FUNDO (mais visível e NÍTIDA) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="relative h-[420px] w-[420px] sm:h-[520px] sm:w-[520px] lg:h-[720px] lg:w-[720px] opacity-[0.36]">
          <Image
            src="/kc.png"
            alt="KC"
            fill
            priority
            quality={100}
            className="object-contain drop-shadow-[0_22px_90px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>

      <div className={ui.wrap}>
        <div className={ui.card}>
          {/* ✅ logo pequena dentro do card (opcional, mas fica lindo) */}
          <div className="mb-5 flex justify-center">
            <div className="relative h-14 w-14 opacity-95">
              <Image
                src="/kc.png"
                alt="KC"
                fill
                priority
                quality={100}
                className="object-contain"
              />
            </div>
          </div>

          <h1 className={ui.title}>Login</h1>
          <p className={ui.sub}>Acesse para gerenciar imóveis e corretores.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <div className={ui.label}>E-MAIL</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="admin@crm.com"
                className={ui.input}
              />
            </div>

            <div>
              <div className={ui.label}>SENHA</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={ui.input}
              />
            </div>

            <button type="submit" className={ui.btnPrimary} disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              className={ui.btnGhost}
              onClick={() => {
                setEmail("");
                setPassword("");
                setErrorMsg("");
              }}
              disabled={loading}
            >
              Limpar
            </button>
          </form>

          {errorMsg ? <div className={ui.error}>{errorMsg}</div> : null}

          <div className="mt-6 text-center text-xs text-white/45">
            CRM Imobiliária • Acesso restrito
          </div>
        </div>
      </div>
    </div>
  );
}
