const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function toBool(v) {
  if (v === true || v === false) return v;
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0) return false;
  return null;
}

exports.atualizarPlaca = async (req, res) => {
  try {
    const imovelId = String(req.params.id || "").trim();
    if (!imovelId) return res.status(400).json({ error: "Imóvel inválido." });

    const meId = String(req.user?.id || "").trim();
    if (!meId) return res.status(401).json({ error: "Token sem id do usuário." });

    const next = toBool(req.body?.haPlaca);
    if (next === null) return res.status(400).json({ error: "Envie haPlaca como true/false." });

    const result = await prisma.$transaction(async (tx) => {
      const imovel = await tx.imovel.findUnique({ where: { id: imovelId } });
      if (!imovel) return null;

      if (!!imovel.haPlaca === !!next) {
        return { imovel, evento: null };
      }

      const evento = await tx.imovelPlacaEvento.create({
        data: {
          imovelId,
          userId: meId,
          acao: next ? "COLOCOU" : "REMOVEU",
        },
      });

      const imovelUpd = await tx.imovel.update({
        where: { id: imovelId },
        data: { haPlaca: next },
      });

      return { imovel: imovelUpd, evento };
    });

    if (!result) return res.status(404).json({ error: "Imóvel não encontrado." });

    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro ao atualizar placa." });
  }
};
