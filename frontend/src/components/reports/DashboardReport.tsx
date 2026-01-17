// src/components/reports/DashboardReport.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

type Bucket = {
  label: string;
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
  porUsuario: Array<{ userId: string; name: string; count: number }>;
};

type NegocioResumo = {
  tipo: "VENDA" | "ALUGUEL";
  series: { ano: Bucket[]; mes: Bucket[]; semana: Bucket[] };
  totais: { ano: Totals; mes: Totals; semana: Totals };
};

type RangeKey = "ano" | "mes" | "semana";

export type ReportData = {
  periodoLabel: string;
  range: RangeKey;
  placas: PlacasResumo | null;
  vendas: NegocioResumo | null;
  aluguels: NegocioResumo | null;
  geradoEmISO?: string;
};

function moneyBRL(n: number) {
  return (Number(n || 0)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
function pct(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toFixed(1)}%`;
}
function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 26,
    fontSize: 10.5,
    color: "#EDEDED",
    backgroundColor: "#0B0B0D",
  },

  // Header / Footer
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2F",
  },
  title: { fontSize: 16, fontWeight: 700 },
  subtitle: { marginTop: 4, color: "#B7B7C2" },
  meta: { marginTop: 2, color: "#9A9AA5" },

  footer: {
    position: "absolute",
    left: 26,
    right: 26,
    bottom: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2F",
    color: "#8F8F9A",
    fontSize: 9,
  },

  // Section
  section: { marginTop: 14 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: 700 },
  sectionHint: { color: "#9A9AA5" },

  // Cards grid (2 columns)
  grid2: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },

  card: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2F",
    backgroundColor: "#121216",
  },
  cardLabel: { color: "#9A9AA5", fontSize: 9, letterSpacing: 0.6 },
  cardValue: { marginTop: 6, fontSize: 14, fontWeight: 700 },
  cardHint: { marginTop: 2, color: "#B7B7C2", fontSize: 9 },

  // Table / bars
  table: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2F",
    backgroundColor: "#101014",
  },
  tableTitle: { fontSize: 11, fontWeight: 700 },
  tableSub: { marginTop: 2, color: "#9A9AA5", fontSize: 9 },

  row: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  cellLabel: { width: "34%", color: "#CFCFDC", fontSize: 9 },
  cellBarWrap: {
    width: "50%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#1B1B22",
    borderWidth: 1,
    borderColor: "#2A2A2F",
    overflow: "hidden",
  },
  cellBarFill: { height: "100%", backgroundColor: "#FFFFFF" },
  cellValue: {
    width: "16%",
    textAlign: "right",
    color: "#EDEDED",
    fontSize: 9,
    fontWeight: 700,
  },

  // Small list
  listItem: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  listName: { color: "#CFCFDC", width: "70%" },
  listCount: { width: "30%", textAlign: "right", fontWeight: 700 },
});

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
    </View>
  );
}

function Bars({
  title,
  subtitle,
  rows,
  getValue,
  formatValue,
}: {
  title: string;
  subtitle?: string;
  rows: Bucket[];
  getValue: (b: Bucket) => number;
  formatValue: (n: number) => string;
}) {
  const values = rows.map(getValue);
  const max = Math.max(1, ...values.map((n) => safeNum(n)));

  return (
    <View style={styles.table}>
      <Text style={styles.tableTitle}>{title}</Text>
      {subtitle ? <Text style={styles.tableSub}>{subtitle}</Text> : null}

      {rows.length === 0 ? (
        <Text style={{ marginTop: 10, color: "#9A9AA5" }}>Sem dados no período.</Text>
      ) : (
        rows.map((b, i) => {
          const v = safeNum(getValue(b));
          const w = Math.max(0, Math.min(100, (v / max) * 100));

          return (
            <View key={i} style={styles.row}>
              <Text style={styles.cellLabel}>{b.label}</Text>

              <View style={styles.cellBarWrap}>
                <View style={[styles.cellBarFill, { width: `${w}%`, opacity: 0.18 }]} />
              </View>

              <Text style={styles.cellValue}>{formatValue(v)}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

export function DashboardReport({ data }: { data: ReportData }) {
  const now = data.geradoEmISO ? new Date(data.geradoEmISO) : new Date();
  const geradoEm = now.toLocaleString("pt-BR");

  const placas = data.placas;
  const vendas = data.vendas;
  const alugs = data.aluguels;

  const range = data.range;

  const emplacados = placas?.emplacados?.[range] ?? [];
  const vendasSeries = vendas?.series?.[range] ?? [];
  const alugsSeries = alugs?.series?.[range] ?? [];

  const vendasTot = vendas?.totais?.[range] ?? {
    count: 0, bruto: 0, comissao: 0, liquido: 0, venda: 0, aluguel: 0,
  };

  const alugsTot = alugs?.totais?.[range] ?? {
    count: 0, bruto: 0, comissao: 0, liquido: 0, venda: 0, aluguel: 0,
  };

  const pctComPlaca = placas?.resumo?.pctComPlaca ?? 0;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* HEADER */}
        <View style={styles.header} fixed>
          <Text style={styles.title}>Relatório — Dashboard</Text>
          <Text style={styles.subtitle}>Período: {data.periodoLabel}</Text>
          <Text style={styles.meta}>Gerado em: {geradoEm}</Text>
        </View>

        {/* PLACAS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Placas</Text>
            <Text style={styles.sectionHint}>Status atual e eventos no período</Text>
          </View>

          <View style={styles.grid2}>
            <View style={styles.col}>
              <Stat
                label="IMÓVEIS ATIVOS"
                value={String(placas?.resumo?.totalAtivos ?? 0)}
                hint="Base de comparação"
              />
            </View>
            <View style={styles.col}>
              <Stat
                label="COM PLACA"
                value={`${String(placas?.resumo?.comPlaca ?? 0)} (${pct(pctComPlaca)})`}
                hint="Percentual sobre ativos"
              />
            </View>
          </View>

          <View style={{ marginTop: 10 }} />

          <View style={styles.grid2}>
            <View style={styles.col}>
              <Stat
                label="SEM PLACA"
                value={`${String(placas?.resumo?.semPlaca ?? 0)} (${pct(placas?.resumo?.pctSemPlaca ?? 0)})`}
                hint="Percentual sobre ativos"
              />
            </View>
            <View style={styles.col}>
              <Stat
                label="PLACA (EVENTOS)"
                value={String(emplacados.reduce((acc, x) => acc + safeNum(x.count), 0))}
                hint="Total de emplacados no período"
              />
            </View>
          </View>

          <Bars
            title="Emplacados no período"
            subtitle={
              range === "ano"
                ? "Últimos 12 meses"
                : range === "mes"
                ? "Últimas 4 semanas"
                : "Últimos 7 dias"
            }
            rows={emplacados}
            getValue={(b) => b.count}
            formatValue={(n) => String(Math.round(n))}
          />

          <View style={styles.table}>
            <Text style={styles.tableTitle}>Placas por corretor</Text>
            <Text style={styles.tableSub}>Mostra somente usuários com eventos</Text>

            {placas?.porUsuario?.length ? (
              placas.porUsuario.slice(0, 12).map((u, i) => (
                <View key={u.userId ?? i} style={styles.listItem}>
                  <Text style={styles.listName}>{u.name}</Text>
                  <Text style={styles.listCount}>{u.count}</Text>
                </View>
              ))
            ) : (
              <Text style={{ marginTop: 10, color: "#9A9AA5" }}>Sem dados.</Text>
            )}
          </View>
        </View>

        {/* VENDAS */}
        <View style={styles.section} break>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vendas</Text>
            <Text style={styles.sectionHint}>Totais e série do período</Text>
          </View>

          <View style={styles.grid2}>
            <View style={styles.col}>
              <Stat label="QUANTIDADE" value={String(vendasTot.count)} />
            </View>
            <View style={styles.col}>
              <Stat label="VALOR VENDA" value={moneyBRL(vendasTot.venda)} hint="Soma do valorVenda" />
            </View>
          </View>

          <View style={{ marginTop: 10 }} />

          <View style={styles.grid2}>
            <View style={styles.col}>
              <Stat label="BRUTO TOTAL" value={moneyBRL(vendasTot.bruto)} />
            </View>
            <View style={styles.col}>
              <Stat
                label="LÍQUIDO TOTAL"
                value={moneyBRL(vendasTot.liquido)}
                hint={`Comissão: ${moneyBRL(vendasTot.comissao)}`}
              />
            </View>
          </View>

          <Bars
            title="Vendas (quantidade)"
            subtitle="Distribuição por faixa/tempo"
            rows={vendasSeries}
            getValue={(b) => b.count}
            formatValue={(n) => String(Math.round(n))}
          />

          <Bars
            title="Vendas (R$)"
            subtitle="Soma do valor de venda"
            rows={vendasSeries}
            getValue={(b) => safeNum(b.venda ?? 0)}
            formatValue={moneyBRL}
          />
        </View>

        {/* ALUGUÉIS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aluguéis</Text>
            <Text style={styles.sectionHint}>Totais do contrato e série do período</Text>
          </View>

          <View style={styles.grid2}>
            <View style={styles.col}>
              <Stat label="QUANTIDADE" value={String(alugsTot.count)} />
            </View>
            <View style={styles.col}>
              <Stat
                label="TOTAL ALUGUEL"
                value={moneyBRL(alugsTot.aluguel)}
                hint="Soma do total do contrato"
              />
            </View>
          </View>

          <View style={{ marginTop: 10 }} />

          <View style={styles.grid2}>
            <View style={styles.col}>
              <Stat label="BRUTO TOTAL" value={moneyBRL(alugsTot.bruto)} />
            </View>
            <View style={styles.col}>
              <Stat
                label="LÍQUIDO TOTAL"
                value={moneyBRL(alugsTot.liquido)}
                hint={`Comissão: ${moneyBRL(alugsTot.comissao)}`}
              />
            </View>
          </View>

          <Bars
            title="Aluguéis (quantidade)"
            subtitle="Distribuição por faixa/tempo"
            rows={alugsSeries}
            getValue={(b) => b.count}
            formatValue={(n) => String(Math.round(n))}
          />

          <Bars
            title="Aluguéis (R$)"
            subtitle="Soma do total do contrato"
            rows={alugsSeries}
            getValue={(b) => safeNum(b.aluguel ?? 0)}
            formatValue={moneyBRL}
          />
        </View>

        {/* FOOTER */}
        <Text style={styles.footer} fixed>
          Observação: este PDF é um resumo do dashboard, pronto para impressão.
        </Text>
      </Page>
    </Document>
  );
}
