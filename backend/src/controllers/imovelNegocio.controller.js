const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function toNumber(v) {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function toDate(v) {
  const d = v ? new Date(v) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
function computeLiquido(bruto, comissao, valorLiquido, lucroImobiliaria) {
  if (valorLiquido !== null && valorLiquido !== undefined) return toNumber(valorLiquido);
  if (lucroImobiliaria !== null && lucroImobiliaria !== undefined) return toNumber(lucroImobiliaria);
  return Math.max(0, toNumber(bruto) - toNumber(comissao));
}

exports.comprometerImovel = async (req, res) => {
  try {
    const imovelId = String(req.params.id || "").trim();
    if (!imovelId) return res.status(400).json({ error: "Imóvel inválido." });

    const me = req.user;
    const meId = String(me?.id || "").trim();
    if (!meId) return res.status(401).json({ error: "Token sem id do usuário." });

    const tipo = String(req.body?.tipo || "").toUpperCase().trim();
    if (tipo !== "VENDA" && tipo !== "ALUGUEL") {
      return res.status(400).json({ error: "Tipo deve ser VENDA ou ALUGUEL." });
    }

    const corretorId = String(req.body?.corretorId || meId).trim();

    const dataOcorrencia = toDate(req.body?.dataOcorrencia);

    // VENDA
    const valorVenda = tipo === "VENDA" ? toNumber(req.body?.valorVenda ?? req.body?.valorBruto) : null;

    // ALUGUEL
    const aluguelMensal = tipo === "ALUGUEL" ? (req.body?.aluguelMensal != null ? toNumber(req.body.aluguelMensal) : null) : null;
    const aluguelMeses  = tipo === "ALUGUEL" ? (req.body?.aluguelMeses  != null ? toInt(req.body.aluguelMeses) : null) : null;
    let aluguelTotal    = tipo === "ALUGUEL" ? (req.body?.aluguelTotal  != null ? toNumber(req.body.aluguelTotal) : null) : null;

    if (tipo === "ALUGUEL" && (!aluguelTotal || aluguelTotal <= 0) && aluguelMensal && aluguelMeses) {
      aluguelTotal = aluguelMensal * aluguelMeses;
    }

    // BRUTO (base do dashboard)
    let valorBruto = toNumber(req.body?.valorBruto);
    if (!valorBruto || valorBruto <= 0) {
      if (tipo === "VENDA") valorBruto = valorVenda || 0;
      if (tipo === "ALUGUEL") valorBruto = aluguelTotal || 0;
    }
    if (!valorBruto || valorBruto <= 0) {
      return res.status(400).json({ error: "Informe valores do negócio (venda/aluguel) para gerar o valorBruto." });
    }

    // Comissão
    let comissaoValor   = toNumber(req.body?.comissaoValor);
    let comissaoPercent = toNumber(req.body?.comissaoPercent);

    if ((!comissaoValor || comissaoValor <= 0) && comissaoPercent > 0) {
      comissaoValor = (valorBruto * comissaoPercent) / 100;
    }
    if ((!comissaoPercent || comissaoPercent <= 0) && comissaoValor > 0 && valorBruto > 0) {
      comissaoPercent = (comissaoValor / valorBruto) * 100;
    }
    if (!comissaoValor || comissaoValor <= 0) {
      return res.status(400).json({ error: "Informe comissaoValor ou comissaoPercent." });
    }

    const valorLiquido     = req.body?.valorLiquido != null ? toNumber(req.body.valorLiquido) : null;
    const lucroImobiliaria = req.body?.lucroImobiliaria != null ? toNumber(req.body.lucroImobiliaria) : null;

    const liquidoFinal = computeLiquido(valorBruto, comissaoValor, valorLiquido, lucroImobiliaria);

    const observacoes = (req.body?.observacoes ?? "").toString().trim() || null;

    const result = await prisma.$transaction(async (tx) => {
      const imovel = await tx.imovel.findUnique({
        where: { id: imovelId },
        include: { negocio: true },
      });
      if (!imovel) return null;

      if (imovel.status === "COMPROMETIDO" || imovel.negocio) {
        const err = new Error("ALREADY");
        err.code = "ALREADY";
        throw err;
      }

      const negocio = await tx.imovelNegocio.create({
        data: {
          imovelId,
          tipo,
          dataOcorrencia,
          corretorId,

          valorVenda: tipo === "VENDA" ? valorVenda : null,
          aluguelMensal: tipo === "ALUGUEL" ? aluguelMensal : null,
          aluguelMeses:  tipo === "ALUGUEL" ? aluguelMeses : null,
          aluguelTotal:  tipo === "ALUGUEL" ? aluguelTotal : null,

          valorBruto,
          comissaoPercent: comissaoPercent > 0 ? comissaoPercent : null,
          comissaoValor,
          valorLiquido: liquidoFinal,
          lucroImobiliaria,
          observacoes,
        },
      });

      const imovelUpd = await tx.imovel.update({
        where: { id: imovelId },
        data: {
          status: "COMPROMETIDO",
          comprometidoAt: new Date(),
          comprometidoByUserId: meId,
        },
      });

      return { negocio, imovel: imovelUpd };
    });

    if (!result) return res.status(404).json({ error: "Imóvel não encontrado." });

    return res.json(result);
  } catch (e) {
    if (e?.code === "ALREADY") {
      return res.status(409).json({ error: "Este imóvel já está comprometido." });
    }
    console.error(e);
    return res.status(500).json({ error: "Erro ao comprometer imóvel." });
  }
};
