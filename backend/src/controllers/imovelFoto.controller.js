const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

/**
 * LISTAR FOTOS DE UM IMÓVEL
 */
exports.listarFotos = async (req, res) => {
  const { id } = req.params;

  try {
    const fotos = await prisma.imovelFoto.findMany({
      where: { imovelId: id },
      orderBy: { ordem: "asc" },
    });

    res.json(fotos);
  } catch (error) {
    console.error("ERRO AO LISTAR FOTOS:", error);
    res.status(500).json({ error: "Erro ao listar fotos" });
  }
};

/**
 * REMOVER FOTO (DB + ARQUIVO)
 */
exports.removerFoto = async (req, res) => {
  const { fotoId } = req.params;

  try {
    const foto = await prisma.imovelFoto.findUnique({
      where: { id: fotoId },
    });

    if (!foto) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }

    // url pode vir "/uploads/xxx.jpg" ou "http://localhost:3333/uploads/xxx.jpg"
    let pathname = foto.url;

    // se for absoluta, pega apenas o pathname
    try {
      if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
        pathname = new URL(pathname).pathname;
      }
    } catch {
      // ignora parse falho
    }

    // remove "/" do começo para virar caminho relativo no disco
    const relative = String(pathname || "").replace(/^\//, "");
    const filePath = path.join(process.cwd(), relative);

    // Apaga arquivo se existir
    if (relative && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove do banco
    await prisma.imovelFoto.delete({
      where: { id: fotoId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("ERRO AO REMOVER FOTO:", error);
    res.status(500).json({ error: "Erro ao remover foto" });
  }
};

/**
 * REORDENAR FOTOS (FORMA SEGURA)
 * Espera: { fotos: [{ id: string, ordem: number }] }
 */
exports.reordenarFotos = async (req, res) => {
  const { fotos } = req.body;

  if (!Array.isArray(fotos)) {
    return res.status(400).json({ error: "Formato inválido: fotos deve ser um array" });
  }

  if (fotos.length === 0) {
    return res.json({ ok: true, fotos: [] });
  }

  // normaliza e valida payload
  const payload = fotos
    .map((f, idx) => {
      const id = String(f?.id ?? "").trim();
      const ordemRaw = f?.ordem;

      const ordemNum = Number(ordemRaw);
      const ordem = Number.isFinite(ordemNum) ? Math.trunc(ordemNum) : idx + 1;

      return { id, ordem };
    })
    .filter((x) => x.id);

  if (payload.length === 0) {
    return res.status(400).json({ error: "Nenhum id válido recebido para reordenar" });
  }

  try {
    // Atualiza tudo em transação
    await prisma.$transaction(
      payload.map((p) =>
        prisma.imovelFoto.update({
          where: { id: p.id },
          data: { ordem: p.ordem },
        })
      )
    );

    // (Opcional) devolve as fotos atualizadas (útil pra debug/confirmar)
    const atualizadas = await prisma.imovelFoto.findMany({
      where: { id: { in: payload.map((p) => p.id) } },
      orderBy: { ordem: "asc" },
    });

    return res.json({ ok: true, fotos: atualizadas });
  } catch (error) {
    console.error("ERRO AO REORDENAR:", error);
    return res.status(500).json({ error: "Erro ao reordenar fotos" });
  }
};
