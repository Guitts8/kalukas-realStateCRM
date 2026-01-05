const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");


/* =======================
   HELPERS
======================= */
function toFloat(value) {
  if (value === "" || value === undefined || value === null) return null;
  return Number(value);
}

function toInt(value) {
  if (value === "" || value === undefined || value === null) return null;
  return Number(value);
}

/* =======================
   CRUD IMÓVEL
======================= */
exports.listar = async (req, res) => {
  const imoveis = await prisma.imovel.findMany({
    orderBy: { createdAt: "desc" }
  });
  res.json(imoveis);
};

exports.buscarPorId = async (req, res) => {
  const { id } = req.params;

  const imovel = await prisma.imovel.findUnique({
    where: { id },
    include: {
      usuarios: {
        include: { user: true }
      },
      fotos: true
    }
  });

  if (!imovel) {
    return res.status(404).json({ error: "Imóvel não encontrado" });
  }

  res.json(imovel);
};

exports.criar = async (req, res) => {
  try {
    const {
      titulo,
      cidade,
      bairro,
      endereco,
      cep,
      pontoReferencia,
      valor,
      status,
      areaTerrenoTotal,
      areaConstruida,
      banheiros,
      dormitorios,
      garagens,
      descricao,
      situacao,
      chave
    } = req.body;

    if (!titulo || !cidade || !valor) {
      return res.status(400).json({ error: "Campos obrigatórios" });
    }

    const imovel = await prisma.imovel.create({
      data: {
        titulo,
        cidade,
        bairro,
        endereco,
        cep,
        pontoReferencia,
        valor: Number(valor),
        status: status || "ATIVO",
        areaTerrenoTotal: toFloat(areaTerrenoTotal),
        areaConstruida: toFloat(areaConstruida),
        banheiros: toInt(banheiros),
        dormitorios: toInt(dormitorios),
        garagens: toInt(garagens),
        descricao,
        situacao,
        chave
      }
    });

    res.status(201).json(imovel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar imóvel" });
  }
};

exports.atualizar = async (req, res) => {
  const { id } = req.params;

  try {
    const imovel = await prisma.imovel.update({
      where: { id },
      data: {
        ...req.body,
        valor: req.body.valor ? Number(req.body.valor) : undefined,
        areaTerrenoTotal: toFloat(req.body.areaTerrenoTotal),
        areaConstruida: toFloat(req.body.areaConstruida),
        banheiros: toInt(req.body.banheiros),
        dormitorios: toInt(req.body.dormitorios),
        garagens: toInt(req.body.garagens)
      }
    });

    res.json(imovel);
  } catch {
    res.status(404).json({ error: "Imóvel não encontrado" });
  }
};

exports.excluir = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.imovel.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Imóvel não encontrado" });
  }
};

/* =======================
   USUÁRIOS DO IMÓVEL
======================= */
exports.associarUsuario = async (req, res) => {
  const { id } = req.params;
  const { userId, tipo } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId é obrigatório" });
  }

  try {
    const relacao = await prisma.imovelUser.create({
      data: { imovelId: id, userId, tipo }
    });

    res.status(201).json(relacao);
  } catch {
    res.status(400).json({ error: "Usuário já associado" });
  }
};

exports.listarUsuarios = async (req, res) => {
  const { id } = req.params;

  const relacoes = await prisma.imovelUser.findMany({
    where: { imovelId: id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  res.json(relacoes.map(r => r.user));
};

exports.removerUsuario = async (req, res) => {
  const { id, userId } = req.params;

  try {
    await prisma.imovelUser.delete({
      where: {
        userId_imovelId: { userId, imovelId: id }
      }
    });

    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Associação não encontrada" });
  }
};

/* =======================
   FOTOS (UPLOAD)
======================= */
exports.uploadFotos = async (req, res) => {
  const { id } = req.params;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhuma foto enviada" });
    }

    // pegar última ordem
    const ultima = await prisma.imovelFoto.findFirst({
      where: { imovelId: id },
      orderBy: { ordem: "desc" }
    });

    let ordemAtual = ultima ? ultima.ordem : 0;

    const fotos = await Promise.all(
      req.files.map(file => {
        ordemAtual++;

        return prisma.imovelFoto.create({
          data: {
            imovelId: id,
            url: `/uploads/imoveis/${file.filename}`,
            ordem: ordemAtual
          }
        });
      })
    );

    res.status(201).json(fotos);
  } catch (error) {
    console.error("ERRO UPLOAD FOTOS:", error);
    res.status(500).json({ error: "Erro ao salvar fotos" });
  }
};
