// frontend/src/app/imoveis/novo/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import YesNoSwitch from "../../../../components/YesNoSwitch";

type Situacao = "ALUGAR" | "VENDER" | "INATIVO";

function asNumberOrNull(v: string): number | null {
  const s = (v ?? "").toString().trim();
  if (!s) return null;

  // aceita "500.000,00" / "500000" / "500000.00"
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function GlassCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10",
        "bg-gradient-to-b from-white/[0.06] to-white/[0.02]",
        "shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
        className,
      ].join(" ")}
    >
      {(title || subtitle || right) && (
        <div className="flex flex-col gap-3 px-6 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-bold text-white/95">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-white/60">{subtitle}</p> : null}
          </div>
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
      )}
      <div className={(title || subtitle || right) ? "px-6 pb-6 pt-4" : "p-6"}>{children}</div>
    </div>
  );
}

export default function NovoImovelPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [cep, setCep] = useState("");
  const [pontoRef, setPontoRef] = useState("");

  const [valor, setValor] = useState("");
  const [areaTotal, setAreaTotal] = useState("");
  const [areaConstruida, setAreaConstruida] = useState("");
  const [banheiros, setBanheiros] = useState("");
  const [dormitorios, setDormitorios] = useState("");
  const [garagens, setGaragens] = useState("");
  const [chave, setChave] = useState("");

  const [situacao, setSituacao] = useState<Situacao>("VENDER");
  const [haPlaca, setHaPlaca] = useState<boolean>(true);

  const [nomeContato, setNomeContato] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");

  const [descricao, setDescricao] = useState("");

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
    "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.35)] " +
    "hover:bg-white/8 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_18px_70px_rgba(0,0,0,0.45)] " +
    "active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed";

  const situacaoCard = "rounded-2xl border border-white/10 bg-black/20 p-4 ring-1 ring-white/10";

  const situacaoRow = (active: boolean) =>
    [
      "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
      active
        ? "border-white/25 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
    ].join(" ");

  async function handleCriar() {
    if (!titulo.trim()) return alert("Informe o título.");
    if (!cidade.trim()) return alert("Informe a cidade.");
    if (!bairro.trim()) return alert("Informe o bairro.");

    const nomeC = nomeContato.trim();
    const telC = telefoneContato.trim();

    const payload: any = {
      titulo: titulo.trim(),
      cidade: cidade.trim(),
      bairro: bairro.trim(),
      endereco: endereco.trim(),
      numero: numero.trim(),
      cep: cep.trim(),
      pontoRef: pontoRef.trim(),

      valor: asNumberOrNull(valor),
      areaTotal: asNumberOrNull(areaTotal),
      areaConstruida: asNumberOrNull(areaConstruida),
      banheiros: asNumberOrNull(banheiros),
      dormitorios: asNumberOrNull(dormitorios),
      garagens: asNumberOrNull(garagens),
      chave: chave.trim(),

      situacao, // "ALUGAR" | "VENDER" | "INATIVO"
      haPlaca,

      // ✅ padrão novo
      nomeContato: nomeC,
      telefoneContato: telC,

      // ✅ compat com preview/API antiga
      contato: nomeC,
      telefone: telC,

      descricao: descricao.trim(),
    };

    try {
      setSaving(true);
      await api.post("/imoveis", payload);
      router.push("/imoveis");
    } catch {
      alert("Erro ao criar imóvel");
    } finally {
      setSaving(false);
    }
  }

  const subLocal = useMemo(() => {
    const c = cidade.trim() || "—";
    const b = bairro.trim() || "—";
    return `${c} • ${b}`;
  }, [cidade, bairro]);

  return (
    <div className="w-full px-6 py-6 text-white">
      <div className="mx-auto w-full max-w-[1180px]">
        {/* HEADER */}
        <div className={headerCard + " p-7"}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push("/imoveis")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
              >
                ← Voltar
              </button>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Novo Imóvel</h1>
              <p className="mt-1 text-sm text-white/65">{subLocal}</p>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className={btnNeutral} onClick={() => router.push("/imoveis")} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className={btnAmber} onClick={handleCriar} disabled={saving}>
                {saving ? "Salvando..." : "Criar imóvel"}
              </button>
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard
            title="Dados principais"
            right={
              <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-bold ring-1 ring-white/10">
                Identificação
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className={labelBase}>TÍTULO</div>
                <input
                  className={inputBase}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Casa na praia"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className={labelBase}>CIDADE</div>
                  <input className={inputBase} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Canoas" />
                </div>
                <div>
                  <div className={labelBase}>BAIRRO</div>
                  <input className={inputBase} value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Moinhos" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className={labelBase}>ENDEREÇO</div>
                  <input className={inputBase} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Ex: Phoenix" />
                </div>
                <div>
                  <div className={labelBase}>NÚMERO</div>
                  <input className={inputBase} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 1455" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className={labelBase}>CEP</div>
                  <input className={inputBase} value={cep} onChange={(e) => setCep(e.target.value)} placeholder="Ex: 99999999" />
                </div>
                <div>
                  <div className={labelBase}>PONTO REF.</div>
                  <input className={inputBase} value={pontoRef} onChange={(e) => setPontoRef(e.target.value)} placeholder="Ex: Próximo ao..." />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className={labelBase}>CONTATO</div>
                  <input className={inputBase} value={nomeContato} onChange={(e) => setNomeContato(e.target.value)} placeholder="Ex: João Silva" />
                </div>
                <div>
                  <div className={labelBase}>TELEFONE</div>
                  <input className={inputBase} value={telefoneContato} onChange={(e) => setTelefoneContato(e.target.value)} placeholder="Ex: 5199999999" />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            title="Valores e medidas"
            right={
              <span className="rounded-full bg-white/6 px-3 py-1 text-xs font-bold ring-1 ring-white/10">
                Detalhes
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className={labelBase}>VALOR (R$)</div>
                <input className={inputBase} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex: 500000" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className={labelBase}>ÁREA TOTAL (m²)</div>
                  <input className={inputBase} value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} placeholder="Ex: 192" />
                </div>
                <div>
                  <div className={labelBase}>ÁREA CONSTRUÍDA (m²)</div>
                  <input className={inputBase} value={areaConstruida} onChange={(e) => setAreaConstruida(e.target.value)} placeholder="Ex: 152" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <div className={labelBase}>BANHEIROS</div>
                  <input className={inputBase} value={banheiros} onChange={(e) => setBanheiros(e.target.value)} placeholder="Ex: 2" />
                </div>
                <div>
                  <div className={labelBase}>DORMITÓRIOS</div>
                  <input className={inputBase} value={dormitorios} onChange={(e) => setDormitorios(e.target.value)} placeholder="Ex: 3" />
                </div>
                <div>
                  <div className={labelBase}>GARAGENS</div>
                  <input className={inputBase} value={garagens} onChange={(e) => setGaragens(e.target.value)} placeholder="Ex: 1" />
                </div>
              </div>

              <div>
                <div className={labelBase}>CHAVE</div>
                <input className={inputBase} value={chave} onChange={(e) => setChave(e.target.value)} placeholder="Ex: Disponível" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* LINHA 2 */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard
            title="Situação do imóvel"
            right={<span className="rounded-full bg-white/6 px-3 py-1 text-xs font-bold ring-1 ring-white/10">Publicação</span>}
          >
            <div className={situacaoCard}>
              <button type="button" className={situacaoRow(situacao === "ALUGAR")} onClick={() => setSituacao("ALUGAR")}>
                <span
                  className={[
                    "h-4 w-4 rounded-full border",
                    situacao === "ALUGAR"
                      ? "border-emerald-400/60 bg-emerald-400/20 shadow-[0_0_18px_rgba(16,185,129,0.18)]"
                      : "border-white/25",
                  ].join(" ")}
                />
                <span className="font-semibold">Para alugar</span>
              </button>

              <div className="h-2" />

              <button type="button" className={situacaoRow(situacao === "VENDER")} onClick={() => setSituacao("VENDER")}>
                <span
                  className={[
                    "h-4 w-4 rounded-full border",
                    situacao === "VENDER"
                      ? "border-emerald-400/60 bg-emerald-400/20 shadow-[0_0_18px_rgba(16,185,129,0.18)]"
                      : "border-white/25",
                  ].join(" ")}
                />
                <span className="font-semibold">Para vender</span>
              </button>

              <div className="h-2" />

              <button type="button" className={situacaoRow(situacao === "INATIVO")} onClick={() => setSituacao("INATIVO")}>
                <span
                  className={[
                    "h-4 w-4 rounded-full border",
                    situacao === "INATIVO"
                      ? "border-amber-300/60 bg-amber-300/20 shadow-[0_0_18px_rgba(251,191,36,0.18)]"
                      : "border-white/25",
                  ].join(" ")}
                />
                <span className="font-semibold">Inativo</span>
              </button>
            </div>
          </GlassCard>

          <GlassCard
            title="Placa"
            right={<span className="rounded-full bg-white/6 px-3 py-1 text-xs font-bold ring-1 ring-white/10">Sinalização</span>}
          >
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-base font-bold text-white/90">Há placa</div>
                  <div className="text-sm text-white/60">Marque se existe placa no imóvel</div>
                </div>

                <YesNoSwitch value={haPlaca} onChange={setHaPlaca} />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* DESCRIÇÃO */}
        <div className="mt-6">
          <GlassCard
            title="Descrição"
            right={<span className="rounded-full bg-white/6 px-3 py-1 text-xs font-bold ring-1 ring-white/10">Texto</span>}
          >
            <textarea
              className={[
                "min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4",
                "text-sm text-white/90 outline-none placeholder:text-white/25",
                "focus:border-white/18 focus:ring-2 focus:ring-amber-300/10",
              ].join(" ")}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o imóvel..."
            />
          </GlassCard>
        </div>

        {/* AÇÕES EMBAIXO */}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnNeutral} onClick={() => router.push("/imoveis")} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className={btnAmber} onClick={handleCriar} disabled={saving}>
            {saving ? "Salvando..." : "Criar imóvel"}
          </button>
        </div>
      </div>
    </div>
  );
}
