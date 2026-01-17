const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =========================
   Helpers
========================= */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function fmtBRDate(d) {
  return new Date(d).toLocaleDateString("pt-BR");
}
function fmtBRMonth(d) {
  return new Date(d).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}
function num(v) {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function liquido(it) {
  // prioridade: valorLiquido, depois lucroImobiliaria, senão bruto - comissao
  if (it.valorLiquido !== null && it.valorLiquido !== undefined) return num(it.valorLiquido);
  if (it.lucroImobiliaria !== null && it.lucroImobiliaria !== undefined) return num(it.lucroImobiliaria);
  return Math.max(0, num(it.valorBruto) - num(it.comissaoValor));
}

/* =========================
   Buckets
========================= */
function monthlyBuckets12() {
  const now = new Date();
  const start = startOfMonth(addMonths(now, -11));
  const out = [];
  for (let i = 0; i < 12; i++) {
    const s = startOfMonth(addMonths(start, i));
    const e = startOfMonth(addMonths(s, 1));
    out.push({
      key: `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}`,
      label: fmtBRMonth(s),
      start: s,
      end: e,
      count: 0,
      bruto: 0,
      comissao: 0,
      liquido: 0,
      venda: 0,
      aluguel: 0,
    });
  }
  return out;
}

function weeklyBuckets4() {
  const today = startOfDay(new Date());
  const start = addDays(today, -27);
  const out = [];
  for (let w = 0; w < 4; w++) {
    const s = addDays(start, w * 7);
    const e = addDays(s, 7);
    out.push({
      key: `W${w + 1}-${s.toISOString().slice(0, 10)}`,
      label: `${fmtBRDate(s)} – ${fmtBRDate(addDays(e, -1))}`,
      start: s,
      end: e,
      count: 0,
      bruto: 0,
      comissao: 0,
      liquido: 0,
      venda: 0,
      aluguel: 0,
    });
  }
  return out;
}

function dailyBuckets7() {
  const today = startOfDay(new Date());
  const start = addDays(today, -6);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const s = addDays(start, i);
    const e = addDays(s, 1);
    out.push({
      key: s.toISOString().slice(0, 10),
      label: fmtBRDate(s),
      start: s,
      end: e,
      count: 0,
      bruto: 0,
      comissao: 0,
      liquido: 0,
      venda: 0,
      aluguel: 0,
    });
  }
  return out;
}

function fillFinanceBuckets(buckets, rows, dateField, tipo) {
  for (const r of rows) {
    const d = new Date(r[dateField]);
    for (const b of buckets) {
      if (d >= b.start && d < b.end) {
        b.count += 1;
        b.bruto += num(r.valorBruto);
        b.comissao += num(r.comissaoValor);
        b.liquido += liquido(r);

        // separados
        if (tipo === "VENDA") b.venda += num(r.valorVenda ?? r.valorBruto);
        if (tipo === "ALUGUEL") b.aluguel += num(r.aluguelTotal ?? r.valorBruto);

        break;
      }
    }
  }
  return buckets;
}

function totals(buckets) {
  return buckets.reduce(
    (acc, b) => {
      acc.count += b.count;
      acc.bruto += b.bruto;
      acc.comissao += b.comissao;
      acc.liquido += b.liquido;
      acc.venda += b.venda;
      acc.aluguel += b.aluguel;
      return acc;
    },
    { count: 0, bruto: 0, comissao: 0, liquido: 0, venda: 0, aluguel: 0 }
  );
}

/* =========================
   DASHBOARD: VENDAS / ALUGUEIS
========================= */
async function negociosResumo(tipo) {
  const now = new Date();
  const start12m = startOfMonth(addMonths(now, -11));
  const start28d = startOfDay(addDays(now, -27));
  const start7d = startOfDay(addDays(now, -6));

  const rows = await prisma.imovelNegocio.findMany({
    where: { tipo, dataOcorrencia: { gte: start12m } },
    select: {
      dataOcorrencia: true,
      valorBruto: true,
      comissaoValor: true,
      valorLiquido: true,
      lucroImobiliaria: true,
      valorVenda: true,
      aluguelTotal: true,
    },
    orderBy: { dataOcorrencia: "asc" },
  });

  const ano = fillFinanceBuckets(monthlyBuckets12(), rows, "dataOcorrencia", tipo);
  const mes = fillFinanceBuckets(
    weeklyBuckets4(),
    rows.filter((r) => new Date(r.dataOcorrencia) >= start28d),
    "dataOcorrencia",
    tipo
  );
  const semana = fillFinanceBuckets(
    dailyBuckets7(),
    rows.filter((r) => new Date(r.dataOcorrencia) >= start7d),
    "dataOcorrencia",
    tipo
  );

  return {
    tipo,
    series: { ano, mes, semana },
    totais: {
      ano: totals(ano),
      mes: totals(mes),
      semana: totals(semana),
    },
  };
}

exports.vendasResumo = async (req, res) => {
  try {
    return res.json(await negociosResumo("VENDA"));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao gerar resumo de vendas." });
  }
};

exports.alugueisResumo = async (req, res) => {
  try {
    return res.json(await negociosResumo("ALUGUEL"));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao gerar resumo de alugueis." });
  }
};

/* =========================
   DASHBOARD: PLACAS
========================= */
exports.placasResumo = async (req, res) => {
  try {
    const totalAtivos = await prisma.imovel.count({ where: { ativo: true } });
    const comPlaca = await prisma.imovel.count({ where: { ativo: true, haPlaca: true } });
    const semPlaca = Math.max(0, totalAtivos - comPlaca);

    const pctComPlaca = totalAtivos ? (comPlaca / totalAtivos) * 100 : 0;
    const pctSemPlaca = totalAtivos ? (semPlaca / totalAtivos) * 100 : 0;

    const now = new Date();
    const start12m = startOfMonth(addMonths(now, -11));
    const start28d = startOfDay(addDays(now, -27));
    const start7d = startOfDay(addDays(now, -6));

    const ev = await prisma.imovelPlacaEvento.findMany({
      where: { acao: "COLOCOU", createdAt: { gte: start12m } },
      select: { createdAt: true, userId: true, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });

    // séries (somente count)
    const ano = monthlyBuckets12().map((b) => ({ ...b, bruto: undefined, comissao: undefined, liquido: undefined, venda: undefined, aluguel: undefined }));
    const mes = weeklyBuckets4().map((b) => ({ ...b, bruto: undefined, comissao: undefined, liquido: undefined, venda: undefined, aluguel: undefined }));
    const semana = dailyBuckets7().map((b) => ({ ...b, bruto: undefined, comissao: undefined, liquido: undefined, venda: undefined, aluguel: undefined }));

    for (const it of ev) {
      const d = new Date(it.createdAt);
      for (const b of ano) if (d >= b.start && d < b.end) { b.count += 1; break; }
      if (d >= start28d) for (const b of mes) if (d >= b.start && d < b.end) { b.count += 1; break; }
      if (d >= start7d) for (const b of semana) if (d >= b.start && d < b.end) { b.count += 1; break; }
    }

    // por usuário (somente quem colocou)
    const map = new Map();
    for (const e of ev) {
      const uid = e.userId;
      const name = e.user?.name || uid;
      map.set(uid, { userId: uid, name, count: (map.get(uid)?.count || 0) + 1 });
    }

    const porUsuario = Array.from(map.values())
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);

    return res.json({
      resumo: { totalAtivos, comPlaca, semPlaca, pctComPlaca, pctSemPlaca },
      emplacados: { ano, mes, semana },
      porUsuario,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao gerar resumo de placas." });
  }
};
