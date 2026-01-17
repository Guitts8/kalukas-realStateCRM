"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { isAuthed, isAdmin, buildLoginUrl } from "@/services/auth";
import AppShell from "@/components/AppShell";

type Bucket = {
  key: string;
  label: string;
  start: string | Date;
  end: string | Date;
  count: number;
  bruto?: number;
  comissao?: number;
  liquido?: number;
  venda?: number;
  aluguel?: number;
};

type Totals = {
  count: number;
  bruto: number;
  comissao: number;
  liquido: number;
  venda: number;
  aluguel: number;
};

type NegocioResumo = {
  tipo: "VENDA" | "ALUGUEL";
  series: {
    ano: Bucket[];
    mes: Bucket[];
    semana: Bucket[];
  };
  totais: {
    ano: Totals;
    mes: Totals;
    semana: Totals;
  };
};

type PlacasResumo = {
  resumo: {
    totalAtivos: number;
    comPlaca: number;
    semPlaca: number;
    pctComPlaca: number;
    pctSemPlaca: number;
  };
  emplacados: {
    ano: Bucket[];
    mes: Bucket[];
    semana: Bucket[];
  };
  porUsuario: Array<{
    userId: string;
    name: string;
    count: number;
  }>;
};

function asNumber(v: any): number {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function moneyBRL(v: any) {
  const n = asNumber(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function compactNumber(n: number) {
  try {
    return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(n);
  } catch {
    return String(n);
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pct(n: number) {
  const x = Number.isFinite(n) ? n : 0;
  return `${x.toFixed(1)}%`;
}

type RangeKey = "ano" | "mes" | "semana";

const ui = {
  page: "p-10 text-white",
  container: "mx-auto max-w-[1180px] space-y-6",
  card:
    "rounded-3xl bg-white/[0.035] ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
  cardSoft:
    "rounded-3xl bg-white/[0.03] ring-1 ring-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.50)]",
  btnBase:
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] ring-1 ring-white/10 bg-white/5 hover:bg-white/8",
  btnGold:
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-extrabold tracking-wide transition-all duration-200 active:scale-[0.99] " +
    "bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/25 hover:bg-amber-300/14 " +
    "shadow-[0_0_0_1px_rgba(255,214,102,0.18),0_0_22px_rgba(255,214,102,0.10)]",
  btnGhost:
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] " +
    "bg-white/4 text-white/85 ring-1 ring-white/10 hover:bg-white/7",
  pill:
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide bg-white/6 text-white/80 ring-1 ring-white/10",
  pillGold:
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide bg-amber-300/10 text-amber-100 ring-1 ring-amber-300/25",
  pillGood:
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/30 shadow-[0_0_18px_rgba(16,185,129,0.12)]",
  pillBad:
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide bg-rose-500/12 text-rose-200 ring-1 ring-rose-400/30 shadow-[0_0_18px_rgba(244,63,94,0.10)]",
};

function Segmented({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}) {
  const base = "rounded-full px-3 py-1 text-xs font-bold transition-all select-none";
  const active = "bg-white/10 ring-1 ring-white/20";
  const normal = "text-white/60 hover:text-white/85";
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
      <span className="text-xs text-white/70">Período:</span>
      <button
        type="button"
        onClick={() => onChange("ano")}
        className={[base, value === "ano" ? active : normal].join(" ")}
      >
        12 meses
      </button>
      <button
        type="button"
        onClick={() => onChange("mes")}
        className={[base, value === "mes" ? active : normal].join(" ")}
      >
        4 semanas
      </button>
      <button
        type="button"
        onClick={() => onChange("semana")}
        className={[base, value === "semana" ? active : normal].join(" ")}
      >
        7 dias
      </button>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  badge,
}: {
  title: string;
  value: string;
  hint?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className={[ui.cardSoft, "p-5"].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-black tracking-widest text-white/45">
          {title}
        </div>
        {badge ?? null}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/45">{hint}</div> : null}
    </div>
  );
}

function BarChart({
  title,
  subtitle,
  data,
  valueKey = "count",
  formatValue,
  rightHint,
}: {
  title: string;
  subtitle?: string;
  data: Array<Bucket | { label: string; count: number; value?: number }>;
  valueKey?: "count" | "bruto" | "liquido" | "comissao" | "venda" | "aluguel";
  formatValue?: (n: number) => string;
  rightHint?: string;
}) {
  const rows = data.map((d: any) => {
    const v = asNumber(d[valueKey] ?? d.count ?? 0);
    return { label: d.label, v, raw: d };
  });

  const max = Math.max(1, ...rows.map((x) => x.v));
  const fmt = formatValue ?? ((n: number) => compactNumber(n));

  return (
    <div className={[ui.cardSoft, "p-6"].join(" ")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-white/55">{subtitle}</div> : null}
        </div>
        {rightHint ? <div className="text-xs text-white/45">{rightHint}</div> : null}
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((r, idx) => {
          const pctW = (r.v / max) * 100;
          return (
            <div key={idx} className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-4 md:col-span-3 text-xs text-white/65 font-semibold truncate">
                {r.label}
              </div>

              <div className="col-span-6 md:col-span-7">
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                  <div
                    className="h-full rounded-full bg-white/20"
                    style={{ width: `${clamp(pctW, 0, 100)}%` }}
                    title={`${r.label}: ${fmt(r.v)}`}
                  />
                </div>
              </div>

              <div className="col-span-2 text-right text-xs font-extrabold text-white/80">
                {fmt(r.v)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Donut({
  pctValue,
  labelLeft,
  labelRight,
}: {
  pctValue: number;
  labelLeft: string;
  labelRight: string;
}) {
  const p = clamp(asNumber(pctValue), 0, 100);
  const bg = `conic-gradient(rgba(251,191,36,0.55) ${p}%, rgba(255,255,255,0.10) 0)`;
  return (
    <div className={[ui.cardSoft, "p-6"].join(" ")}>
      <div className="text-lg font-extrabold">Placas (status atual)</div>
      <div className="mt-1 text-sm text-white/55">
        Distribuição dos imóveis ativos com/sem placa
      </div>

      <div className="mt-5 flex flex-col md:flex-row md:items-center gap-6">
        <div
          className="relative h-36 w-36 rounded-full ring-1 ring-white/10"
          style={{ background: bg }}
          title={pct(p)}
        >
          <div className="absolute inset-3 rounded-full bg-black/35 ring-1 ring-white/10 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-extrabold">{pct(p)}</div>
              <div className="text-[11px] text-white/50 font-black tracking-widest">
                COM PLACA
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
            <div className="text-[10px] font-black tracking-widest text-white/45">
              {labelLeft}
            </div>
            <div className="mt-1 text-xl font-extrabold">{pct(p)}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
            <div className="text-[10px] font-black tracking-widest text-white/45">
              {labelRight}
            </div>
            <div className="mt-1 text-xl font-extrabold">{pct(100 - p)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function periodoLabelFrom(rangeKey: RangeKey) {
  return rangeKey === "ano"
    ? "Últimos 12 meses"
    : rangeKey === "mes"
    ? "Últimas 4 semanas"
    : "Últimos 7 dias";
}

export default function DashboardPage() {
  const router = useRouter();

  const [range, setRange] = useState<RangeKey>("ano");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [placas, setPlacas] = useState<PlacasResumo | null>(null);
  const [vendas, setVendas] = useState<NegocioResumo | null>(null);
  const [aluguels, setAluguels] = useState<NegocioResumo | null>(null);

  const [pdfBusy, setPdfBusy] = useState<RangeKey | null>(null);

  // ✅ Gate: só admin
  useEffect(() => {
    if (!isAuthed()) {
      router.push(buildLoginUrl("/dashboard"));
      return;
    }
    if (!isAdmin()) {
      router.push("/imoveis");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [p, v, a] = await Promise.all([
        api.get("/dashboard/placas"),
        api.get("/dashboard/vendas"),
        api.get("/dashboard/aluguels"),
      ]);

      setPlacas(p.data ?? null);
      setVendas(v.data ?? null);
      setAluguels(a.data ?? null);
    } catch (e) {
      console.error(e);
      setError(
        "Erro ao carregar dados do dashboard. Verifique se você está logado como ADMIN."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downloadPdf(rangeKey: RangeKey) {
    try {
      setPdfBusy(rangeKey);

      // ✅ dynamic imports (evita dor de cabeça com bundler / server)
      const [{ pdf }, { DashboardReport }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/reports/DashboardReport"),
      ]);

      const periodoLabel = periodoLabelFrom(rangeKey);

      const blob = await pdf(
        <DashboardReport
          data={{
            periodoLabel,
            range: rangeKey,
            placas,
            vendas,
            aluguels,
            geradoEmISO: new Date().toISOString(),
          }}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard_${rangeKey}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("Não foi possível gerar o PDF agora. Tente novamente.");
    } finally {
      setPdfBusy(null);
    }
  }

  const vendasTotals = useMemo(() => {
    const t = vendas?.totais?.[range];
    return (
      t ?? {
        count: 0,
        bruto: 0,
        comissao: 0,
        liquido: 0,
        venda: 0,
        aluguel: 0,
      }
    );
  }, [vendas, range]);

  const alugueisTotals = useMemo(() => {
    const t = aluguels?.totais?.[range];
    return (
      t ?? {
        count: 0,
        bruto: 0,
        comissao: 0,
        liquido: 0,
        venda: 0,
        aluguel: 0,
      }
    );
  }, [aluguels, range]);

  const placasSeries = useMemo(() => placas?.emplacados?.[range] ?? [], [placas, range]);
  const vendasSeries = useMemo(() => vendas?.series?.[range] ?? [], [vendas, range]);
  const alugueisSeries = useMemo(() => aluguels?.series?.[range] ?? [], [aluguels, range]);

  const pctComPlaca = placas?.resumo?.pctComPlaca ?? 0;

  const body = (
    <div className={ui.page}>
      <div className={ui.container}>
        {/* HEADER */}
        <div className={[ui.card, "p-8"].join(" ")}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
              <p className="mt-1 text-white/65">
                Indicadores de placas, vendas e aluguéis (somente ADMIN).
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Segmented value={range} onChange={setRange} />
                <span className={ui.pill}>
                  Atualizado em: {new Date().toLocaleString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button className={ui.btnGhost} onClick={() => router.push("/imoveis")}>
                ← Voltar
              </button>

              <button className={ui.btnBase} onClick={load}>
                Recarregar
              </button>

              {/* ✅ PDF buttons */}
              <div className="flex items-center gap-2">
                <button
                  className={ui.btnGold}
                  onClick={() => downloadPdf("semana")}
                  disabled={!!pdfBusy}
                  title="Gerar PDF dos últimos 7 dias"
                >
                  {pdfBusy === "semana" ? "Gerando…" : "PDF 7 dias"}
                </button>

                <button
                  className={ui.btnBase}
                  onClick={() => downloadPdf("mes")}
                  disabled={!!pdfBusy}
                  title="Gerar PDF das últimas 4 semanas"
                >
                  {pdfBusy === "mes" ? "Gerando…" : "PDF 4 semanas"}
                </button>

                <button
                  className={ui.btnBase}
                  onClick={() => downloadPdf("ano")}
                  disabled={!!pdfBusy}
                  title="Gerar PDF dos últimos 12 meses"
                >
                  {pdfBusy === "ano" ? "Gerando…" : "PDF 12 meses"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-rose-100 ring-1 ring-rose-300/10">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className={[ui.card, "p-6"].join(" ")}>Carregando dashboard…</div>
        ) : (
          <>
            {/* PLACAS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Donut pctValue={pctComPlaca} labelLeft="COM PLACA" labelRight="SEM PLACA" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <StatCard
                  title="IMÓVEIS ATIVOS"
                  value={String(placas?.resumo?.totalAtivos ?? 0)}
                  hint="Base de comparação para as placas"
                  badge={<span className={ui.pillGold}>Placas</span>}
                />
                <StatCard
                  title="COM PLACA"
                  value={String(placas?.resumo?.comPlaca ?? 0)}
                  hint="Imóveis ativos com placa"
                  badge={<span className={ui.pillGood}>OK</span>}
                />
                <StatCard
                  title="SEM PLACA"
                  value={String(placas?.resumo?.semPlaca ?? 0)}
                  hint="Imóveis ativos sem placa"
                  badge={<span className={ui.pillBad}>Atenção</span>}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <BarChart
                title="Emplacados no período"
                subtitle={
                  range === "ano"
                    ? "Últimos 12 meses (mês a mês)"
                    : range === "mes"
                    ? "Últimas 4 semanas"
                    : "Últimos 7 dias"
                }
                data={placasSeries}
                valueKey="count"
                formatValue={(n) => String(Math.round(n))}
                rightHint="Evento: COLOCOU placa"
              />

              <div className={[ui.cardSoft, "p-6"].join(" ")}>
                <div className="text-lg font-extrabold">Placas por corretor</div>
                <div className="mt-1 text-sm text-white/55">
                  Mostra somente usuários que colocaram placas
                </div>

                {(!placas?.porUsuario?.length && (
                  <div className="mt-6 text-white/55">Nenhum evento de placa ainda.</div>
                )) || null}

                {placas?.porUsuario?.length ? (
                  <div className="mt-5 space-y-3">
                    {placas.porUsuario.slice(0, 12).map((u) => {
                      const max = Math.max(1, ...placas.porUsuario.map((x) => x.count));
                      const w = (u.count / max) * 100;
                      return (
                        <div key={u.userId} className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-5 text-xs font-semibold text-white/75 truncate">
                            {u.name}
                          </div>
                          <div className="col-span-5">
                            <div className="h-3 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                              <div
                                className="h-full rounded-full bg-amber-300/35"
                                style={{ width: `${clamp(w, 0, 100)}%` }}
                                title={`${u.name}: ${u.count}`}
                              />
                            </div>
                          </div>
                          <div className="col-span-2 text-right text-xs font-extrabold text-white/80">
                            {u.count}
                          </div>
                        </div>
                      );
                    })}
                    {placas.porUsuario.length > 12 ? (
                      <div className="pt-2 text-xs text-white/45">
                        +{placas.porUsuario.length - 12} usuário(s) ocultos
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* VENDAS */}
            <div className={[ui.card, "p-8"].join(" ")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-extrabold">Vendas</div>
                  <div className="mt-1 text-sm text-white/55">
                    Contagem e valores por período (bruto, comissão, líquido)
                  </div>
                </div>
                <span className={ui.pillGold}>VENDA</span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard title="VENDAS" value={String(vendasTotals.count)} />
                <StatCard
                  title="VALOR VENDA"
                  value={moneyBRL(vendasTotals.venda)}
                  hint="Soma (valorVenda/bruto)"
                />
                <StatCard title="BRUTO TOTAL" value={moneyBRL(vendasTotals.bruto)} />
                <StatCard
                  title="LÍQUIDO TOTAL"
                  value={moneyBRL(vendasTotals.liquido)}
                  hint={`Comissão: ${moneyBRL(vendasTotals.comissao)}`}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BarChart
                  title="Vendas por faixa"
                  subtitle={
                    range === "ano"
                      ? "Últimos 12 meses (mês a mês)"
                      : range === "mes"
                      ? "Últimas 4 semanas"
                      : "Últimos 7 dias"
                  }
                  data={vendasSeries}
                  valueKey="count"
                  formatValue={(n) => String(Math.round(n))}
                  rightHint="Quantidade"
                />

                <BarChart
                  title="Valor de venda por faixa"
                  subtitle="Soma do valor de venda"
                  data={vendasSeries}
                  valueKey="venda"
                  formatValue={moneyBRL}
                  rightHint="R$"
                />
              </div>
            </div>

            {/* ALUGUÉIS */}
            <div className={[ui.card, "p-8"].join(" ")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-extrabold">Aluguéis</div>
                  <div className="mt-1 text-sm text-white/55">
                    Total do contrato (mensal x meses) e líquidos por período
                  </div>
                </div>
                <span className={ui.pillGold}>ALUGUEL</span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard title="ALUGUÉIS" value={String(alugueisTotals.count)} />
                <StatCard
                  title="TOTAL ALUGUEL"
                  value={moneyBRL(alugueisTotals.aluguel)}
                  hint="Soma (aluguelTotal/bruto)"
                />
                <StatCard title="BRUTO TOTAL" value={moneyBRL(alugueisTotals.bruto)} />
                <StatCard
                  title="LÍQUIDO TOTAL"
                  value={moneyBRL(alugueisTotals.liquido)}
                  hint={`Comissão: ${moneyBRL(alugueisTotals.comissao)}`}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BarChart
                  title="Aluguéis por faixa"
                  subtitle={
                    range === "ano"
                      ? "Últimos 12 meses (mês a mês)"
                      : range === "mes"
                      ? "Últimas 4 semanas"
                      : "Últimos 7 dias"
                  }
                  data={alugueisSeries}
                  valueKey="count"
                  formatValue={(n) => String(Math.round(n))}
                  rightHint="Quantidade"
                />

                <BarChart
                  title="Total de aluguel por faixa"
                  subtitle="Soma do total do contrato"
                  data={alugueisSeries}
                  valueKey="aluguel"
                  formatValue={moneyBRL}
                  rightHint="R$"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="text-center text-xs text-white/40">
              Dica: os dados de “emplacados” dependem do endpoint{" "}
              <span className="font-bold text-white/55">PUT /imoveis/:id/placa</span>{" "}
              criar eventos.
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ✅ Sidebar disponível: renderiza dentro do AppShell (mesmo padrão das outras telas)
  return <AppShell>{body}</AppShell>;
}
