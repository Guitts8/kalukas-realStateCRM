const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

/**
 * LISTAR FOTOS DE UM IMÓVEL
 */
exports.listarFotos = async (req, res) => {
  const { id } = req.params;

  const fotos = await prisma.imovelFoto.findMany({
    where: { imovelId: id },
    orderBy: { ordem: "asc" }
  });

  res.json(fotos);
};

/**
 * REMOVER FOTO (DB + ARQUIVO)
 */
exports.removerFoto = async (req, res) => {
  const { fotoId } = req.params;

  try {
    const foto = await prisma.imovelFoto.findUnique({
      where: { id: fotoId }
    });

    if (!foto) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }

    // Caminho físico do arquivo
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      foto.url.replace("/", "")
    );

    // Apaga arquivo se existir
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove do banco
    await prisma.imovelFoto.delete({
      where: { id: fotoId }
    });

    res.status(204).send();
  } catch (error) {
    console.error("ERRO AO REMOVER FOTO:", error);
    res.status(500).json({ error: "Erro ao remover foto" });
  }
};

/**
 * REORDENAR FOTOS (FORMA SEGURA)
 */
exports.reordenarFotos = async (req, res) => {
  const { fotos } = req.body;

  if (!Array.isArray(fotos)) {
    return res.status(400).json({ error: "Formato inválido" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1️⃣ limpar ordens
      for (const foto of fotos) {
        await tx.imovelFoto.update({
          where: { id: foto.id },
          data: { ordem: 0 }
        });
      }

      // 2️⃣ aplicar nova ordem
      for (const foto of fotos) {
        await tx.imovelFoto.update({
          where: { id: foto.id },
          data: { ordem: foto.ordem }
        });
      }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("ERRO AO REORDENAR:", error);
    res.status(500).json({ error: "Erro ao reordenar fotos" });
  }
};
