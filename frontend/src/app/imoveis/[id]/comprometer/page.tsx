"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/authContext";
import { isAdmin as isAdminFn } from "@/services/auth";

import GlassSelect from "@/components/GlassSelect"; // ✅ NOVO

type UserItem = {
  id: string;
  name: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
};

type Tipo = "VENDA" | "ALUGUEL";

type ImovelResumo = {
  id: string;
  titulo?: string;
  endereco?: string | null;
  numeroEndereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  cep?: string | null;
};

function asNumber(v: any): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d,.-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function moneyBRL(v: any) {
  const n = asNumber(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toISODateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function fromDateTimeLocalToISO(v: string) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/* =========================
   UI (glass premium)
========================= */
const ui = {
  page: "mx-auto max-w-[980px] p-10 text-white",
  card:
    "rounded-3xl bg-white/[0.035] ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
  title: "text-3xl font-black tracking-tight",
  sub: "mt-2 text-white/55",
  label: "text-[11px] font-black tracking-widest text-white/50",
  input:
    "mt-2 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm text-white/90 outline-none " +
    "placeholder:text-white/30 focus:ring-white/20 focus:bg-white/[0.07]",
  textarea:
    "mt-2 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm text-white/90 outline-none " +
    "placeholder:text-white/30 focus:ring-white/20 focus:bg-white/[0.07]",
  btnBase:
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] ring-1 ring-white/10 bg-white/5 hover:bg-white/8",
  btnGold:
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-extrabold tracking-wide transition-all duration-200 active:scale-[0.99] " +
    "bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/25 hover:bg-amber-300/14 " +
    "shadow-[0_0_0_1px_rgba(255,214,102,0.18),0_0_22px_rgba(255,214,102,0.10)]",
  btnDanger:
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold transition-all duration-200 active:scale-[0.99] " +
    "bg-rose-500/10 text-rose-100 ring-1 ring-rose-400/25 hover:bg-rose-500/14 " +
    "shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_18px_rgba(244,63,94,0.10)]",
  pill:
    "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide ring-1 " +
    "bg-white/6 text-white/80 ring-white/10",
  pillOk:
    "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide ring-1 " +
    "bg-emerald-400/10 text-emerald-100 ring-emerald-300/20",
  pillWarn:
    "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide ring-1 " +
    "bg-amber-400/10 text-amber-100 ring-amber-300/20",
  pillBad:
    "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide ring-1 " +
    "bg-rose-500/10 text-rose-100 ring-rose-400/20",
};

export default function ComprometerImovelPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const admin = useMemo(() => isAdminFn(), [user]);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [imovelInfo, setImovelInfo] = useState<ImovelResumo | null>(null);
  const [loadingImovel, setLoadingImovel] = useState(true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<Tipo>("VENDA");
  const [dataLocal, setDataLocal] = useState<string>(() =>
    toISODateTimeLocalValue(new Date())
  );

  const [corretorId, setCorretorId] = useState<string>("");

  const [valorVenda, setValorVenda] = useState<string>("");

  const [aluguelMensal, setAluguelMensal] = useState<string>("");
  const [aluguelMeses, setAluguelMeses] = useState<string>("");

  const [valorBruto, setValorBruto] = useState<string>("");
  const [valorLiquido, setValorLiquido] = useState<string>("");

  const [comissaoPercent, setComissaoPercent] = useState<string>("");
  const [comissaoValor, setComissaoValor] = useState<string>("");

  const [lucroImobiliaria, setLucroImobiliaria] = useState<string>("");

  const [observacoes, setObservacoes] = useState<string>("");

  // ✅ carrega resumo do imóvel para prévia no topo
  useEffect(() => {
    let alive = true;

    async function carregarImovel() {
      try {
        setLoadingImovel(true);
        const res = await api.get(`/imoveis/${id}`);
        const d = res.data ?? {};

        const info: ImovelResumo = {
          id: d.id,
          titulo: d.titulo,
          endereco: d.endereco ?? null,
          numeroEndereco: d.numeroEndereco ?? d.numero_endereco ?? null,
          bairro: d.bairro ?? null,
          cidade: d.cidade ?? null,
          cep: d.cep ?? null,
        };

        if (alive) setImovelInfo(info);
      } catch {
        if (alive) setImovelInfo(null);
      } finally {
        if (alive) setLoadingImovel(false);
      }
    }

    carregarImovel();

    return () => {
      alive = false;
    };
  }, [id]);

  // default corretorId
  useEffect(() => {
    if (admin) return;
    if (user?.id) setCorretorId(user.id);
  }, [admin, user?.id]);

  // carrega corretores (admin escolhe)
  useEffect(() => {
    async function loadUsers() {
      if (!admin) return;
      try {
        setLoadingUsers(true);
        const res = await api.get("/users");
        const list: UserItem[] = Array.isArray(res.data) ? res.data : [];
        setUsers(list);

        const firstNonAdmin =
          list.find((u) => !(u.isAdmin || u.role === "ADMIN")) ?? null;

        if (!corretorId) {
          setCorretorId(firstNonAdmin?.id || user?.id || "");
        }
      } catch {
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  function sugerirBruto() {
    if (tipo === "VENDA") {
      const v = asNumber(valorVenda);
      if (v > 0) setValorBruto(String(v));
      return;
    }
    const mensal = asNumber(aluguelMensal);
    const meses = asNumber(aluguelMeses);
    if (mensal > 0 && meses > 0) setValorBruto(String(mensal * meses));
  }

  function sugerirComissaoValor() {
    const bruto = asNumber(valorBruto || (tipo === "VENDA" ? valorVenda : 0));
    const p = asNumber(comissaoPercent);
    if (bruto > 0 && p > 0) setComissaoValor(String((bruto * p) / 100));
  }

  function sugerirComissaoPercent() {
    const bruto = asNumber(valorBruto || (tipo === "VENDA" ? valorVenda : 0));
    const v = asNumber(comissaoValor);
    if (bruto > 0 && v > 0) setComissaoPercent(String((v / bruto) * 100));
  }

  const resumo = useMemo(() => {
    const bruto = asNumber(valorBruto || (tipo === "VENDA" ? valorVenda : 0));
    const liquido = asNumber(valorLiquido);
    const comV = asNumber(comissaoValor);
    const lucro = asNumber(lucroImobiliaria);

    const tipoLabel = tipo === "VENDA" ? "Venda" : "Aluguel";
    return { tipoLabel, bruto, liquido, comV, lucro };
  }, [tipo, valorBruto, valorVenda, valorLiquido, comissaoValor, lucroImobiliaria]);

  async function salvar() {
    setMessage(null);
    setError(null);

    const dataOcorrencia = fromDateTimeLocalToISO(dataLocal);
    if (!dataOcorrencia) return setError("Informe uma data válida.");
    if (!corretorId?.trim()) return setError("Selecione o corretor responsável.");

    if (tipo === "VENDA" && asNumber(valorVenda) <= 0) {
      return setError("Informe o valor da venda.");
    }

    if (tipo === "ALUGUEL") {
      if (asNumber(aluguelMensal) <= 0) return setError("Informe o aluguel mensal.");
      if (asNumber(aluguelMeses) <= 0) return setError("Informe a quantidade de meses do contrato.");
    }

    const payload: any = {
      tipo,
      dataOcorrencia,
      corretorId,
      comissaoPercent: asNumber(comissaoPercent) || null,
      comissaoValor: asNumber(comissaoValor) || null,
      valorBruto: asNumber(valorBruto) || null,
      valorLiquido: asNumber(valorLiquido) || null,
      lucroImobiliaria: asNumber(lucroImobiliaria) || null,
      observacoes: observacoes?.trim() || null,
    };

    if (tipo === "VENDA") {
      payload.valorVenda = asNumber(valorVenda);
      payload.aluguelMensal = null;
      payload.aluguelMeses = null;
    } else {
      payload.valorVenda = null;
      payload.aluguelMensal = asNumber(aluguelMensal);
      payload.aluguelMeses = Math.max(1, Math.floor(asNumber(aluguelMeses)));
    }

    try {
      setSaving(true);
      await api.post(`/imoveis/${id}/comprometer`, payload);
      setMessage("Imóvel comprometido com sucesso. Ele deve sair da lista de ativos.");
      window.setTimeout(() => router.push("/imoveis"), 700);
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Erro ao comprometer imóvel.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const enderecoLinha = useMemo(() => {
    if (!imovelInfo) return "—";
    const end = (imovelInfo.endereco ?? "").trim();
    const num = (imovelInfo.numeroEndereco ?? "").trim();
    if (!end && !num) return "—";
    return end + (num ? `, ${num}` : "");
  }, [imovelInfo]);

  const cidadeBairroLinha = useMemo(() => {
    if (!imovelInfo) return "— • —";
    const c = (imovelInfo.cidade ?? "—").trim() || "—";
    const b = (imovelInfo.bairro ?? "—").trim() || "—";
    return `${c} • ${b}`;
  }, [imovelInfo]);

  const tipoOptions = useMemo(
    () => [
      { value: "VENDA", label: "VENDA" },
      { value: "ALUGUEL", label: "ALUGUEL" },
    ],
    []
  );

  const corretorOptions = useMemo(() => {
    const list = users
      .filter((u) => !(u.isAdmin || u.role === "ADMIN"))
      .map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));

    return [{ value: "", label: "Selecione…", disabled: true }, ...list];
  }, [users]);

  return (
    <div className={ui.page}>
      <div className={`${ui.card} p-8`}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className={ui.title}>Comprometer imóvel</h1>
            <p className={ui.sub}>
              Registre uma <span className="text-white/80 font-semibold">venda</span> ou{" "}
              <span className="text-white/80 font-semibold">aluguel</span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {loadingImovel ? (
                <span className={ui.pill}>Carregando imóvel…</span>
              ) : imovelInfo ? (
                <>
                  <span className={ui.pill}>
                    {imovelInfo.titulo?.trim() ? imovelInfo.titulo : "Imóvel"}
                  </span>
                  <span className={ui.pill}>{enderecoLinha}</span>
                  <span className={ui.pill}>{cidadeBairroLinha}</span>
                </>
              ) : (
                <span className={ui.pillBad}>Não foi possível carregar o imóvel</span>
              )}

              <span className={ui.pill}>ID: {id}</span>
              {admin ? <span className={ui.pill}>Admin</span> : <span className={ui.pill}>Corretor</span>}
            </div>
          </div>

          <div className="flex gap-3">
            <button className={ui.btnBase} onClick={() => router.back()} disabled={saving}>
              ← Voltar
            </button>
            <button className={ui.btnGold} onClick={salvar} disabled={saving}>
              {saving ? "Salvando…" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>

      {message ? (
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-emerald-100 ring-1 ring-emerald-300/10">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-rose-100 ring-1 ring-rose-300/10">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${ui.card} p-7`}>
          {/* ✅ TIPO (SEM BUSCA) */}
          <GlassSelect
            label="TIPO"
            value={tipo}
            onChange={(v) => setTipo(v as Tipo)}
            options={tipoOptions}
            disabled={saving}
            searchable={false}
          />

          <div className="mt-5">
            <div className={ui.label}>DATA DA OCORRÊNCIA</div>
            <input
              type="datetime-local"
              className={ui.input}
              value={dataLocal}
              onChange={(e) => setDataLocal(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="mt-5">
            {!admin ? (
              <>
                <div className={ui.label}>CORRETOR RESPONSÁVEL</div>
                <div className="mt-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm text-white/85">
                  {user?.name || "—"}{" "}
                  <span className="text-white/40">({user?.email || "—"})</span>
                </div>
              </>
            ) : (
              <GlassSelect
                label="CORRETOR RESPONSÁVEL"
                value={corretorId}
                onChange={setCorretorId}
                disabled={saving || loadingUsers}
                placeholder="Selecione…"
                options={corretorOptions}
                searchable={true} // ✅ COM BUSCA
              />
            )}
          </div>

          {tipo === "VENDA" ? (
            <div className="mt-5">
              <div className={ui.label}>VALOR DA VENDA</div>
              <input
                className={ui.input}
                value={valorVenda}
                onChange={(e) => setValorVenda(e.target.value)}
                placeholder="Ex.: 350000"
                disabled={saving}
              />
              <div className="mt-2 text-xs text-white/45">
                Dica: você pode “sugerir bruto” com base no valor da venda.
              </div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <div className={ui.label}>ALUGUEL MENSAL</div>
                <input
                  className={ui.input}
                  value={aluguelMensal}
                  onChange={(e) => setAluguelMensal(e.target.value)}
                  placeholder="Ex.: 2500"
                  disabled={saving}
                />
              </div>
              <div>
                <div className={ui.label}>MESES DO CONTRATO</div>
                <input
                  className={ui.input}
                  value={aluguelMeses}
                  onChange={(e) => setAluguelMeses(e.target.value)}
                  placeholder="Ex.: 12"
                  disabled={saving}
                />
              </div>
              <div className="col-span-2 text-xs text-white/45">
                O bruto pode ser calculado por <b>mensal × meses</b>, mas você ainda pode editar manualmente.
              </div>
            </div>
          )}
        </div>

        <div className={`${ui.card} p-7`}>
          <div className="flex items-center justify-between">
            <div className={ui.label}>VALORES & COMISSÃO</div>
            <button
              type="button"
              className={ui.btnBase}
              onClick={sugerirBruto}
              disabled={saving}
              title="Sugerir valor bruto com base nos campos acima"
            >
              Sugerir bruto
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className={ui.label}>VALOR BRUTO</div>
              <input
                className={ui.input}
                value={valorBruto}
                onChange={(e) => setValorBruto(e.target.value)}
                placeholder="Ex.: 350000"
                disabled={saving}
              />
            </div>

            <div>
              <div className={ui.label}>VALOR LÍQUIDO</div>
              <input
                className={ui.input}
                value={valorLiquido}
                onChange={(e) => setValorLiquido(e.target.value)}
                placeholder="Ex.: 332500"
                disabled={saving}
              />
            </div>

            <div>
              <div className={ui.label}>COMISSÃO (%)</div>
              <div className="flex gap-2">
                <input
                  className={ui.input}
                  value={comissaoPercent}
                  onChange={(e) => setComissaoPercent(e.target.value)}
                  placeholder="Ex.: 5"
                  disabled={saving}
                />
                <button
                  type="button"
                  className={ui.btnBase}
                  onClick={sugerirComissaoValor}
                  disabled={saving}
                  title="Calcular comissão (R$) usando bruto e %"
                >
                  →
                </button>
              </div>
            </div>

            <div>
              <div className={ui.label}>COMISSÃO (R$)</div>
              <div className="flex gap-2">
                <input
                  className={ui.input}
                  value={comissaoValor}
                  onChange={(e) => setComissaoValor(e.target.value)}
                  placeholder="Ex.: 17500"
                  disabled={saving}
                />
                <button
                  type="button"
                  className={ui.btnBase}
                  onClick={sugerirComissaoPercent}
                  disabled={saving}
                  title="Calcular comissão (%) usando bruto e R$"
                >
                  %
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <div className={ui.label}>LUCRO IMOBILIÁRIA (R$)</div>
              <input
                className={ui.input}
                value={lucroImobiliaria}
                onChange={(e) => setLucroImobiliaria(e.target.value)}
                placeholder="Ex.: 332500"
                disabled={saving}
              />
            </div>
          </div>

          <div className="mt-5">
            <div className={ui.label}>OBSERVAÇÕES</div>
            <textarea
              className={ui.textarea}
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: Contrato assinado, pagamento via PIX, etc."
              disabled={saving}
            />
          </div>

          <div className="mt-5 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4">
            <div className="text-[11px] font-black tracking-widest text-white/45">
              RESUMO
            </div>
            <div className="mt-2 text-sm text-white/80">
              <div>
                Tipo: <b className="text-white">{resumo.tipoLabel}</b>
              </div>
              <div>
                Bruto: <b className="text-white">{moneyBRL(resumo.bruto)}</b>
              </div>
              <div>
                Líquido: <b className="text-white">{moneyBRL(resumo.liquido)}</b>
              </div>
              <div>
                Comissão: <b className="text-white">{moneyBRL(resumo.comV)}</b>
              </div>
              <div>
                Lucro imobiliária: <b className="text-white">{moneyBRL(resumo.lucro)}</b>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className={ui.btnDanger} onClick={() => router.push("/imoveis")} disabled={saving}>
              Cancelar
            </button>
            <button className={ui.btnGold} onClick={salvar} disabled={saving}>
              {saving ? "Salvando…" : "Confirmar compromisso"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
