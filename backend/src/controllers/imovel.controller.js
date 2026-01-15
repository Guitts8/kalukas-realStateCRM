const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");


/* =======================
   HELPERS
======================= */
const SITUACOES = new Set(["ALUGAR", "VENDER", "INATIVO"]);

function toSituacao(v) {
  if (typeof v !== "string") return undefined;
  const up = v.trim().toUpperCase();
  return SITUACOES.has(up) ? up : undefined;
}

function toBool(value) {
  if (value === true || value === false) return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return undefined;
}


function toInt(v) {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function toFloat(v) {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
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
    const body = req.body || {};

    // ✅ aceita os dois padrões de nomes vindos do frontend
    const titulo = body.titulo?.trim();
    const cidade = body.cidade?.trim();
    const bairro = body.bairro?.trim() || null;
    const endereco = body.endereco?.trim() || null;

    const numeroEndereco =
      (body.numeroEndereco ?? body.numero ?? "").toString().trim() || null;

    const cep = body.cep?.trim() || null;

    const pontoReferencia =
      (body.pontoReferencia ?? body.pontoRef ?? "").toString().trim() || null;

    // ✅ contato (aceita contatoNome OU nomeContato)
    const contatoNome =
      (body.contatoNome ?? body.nomeContato ?? "").toString().trim() || null;

    const contatoTelefone =
      (body.contatoTelefone ?? body.telefoneContato ?? "").toString().trim() || null;

    // ✅ áreas (aceita areaTerrenoTotal OU areaTotal)
    const areaTerrenoTotal = toFloat(body.areaTerrenoTotal ?? body.areaTotal);
    const areaConstruida = toFloat(body.areaConstruida);

    const banheiros = toInt(body.banheiros);
    const dormitorios = toInt(body.dormitorios);
    const garagens = toInt(body.garagens);

    const descricao = body.descricao?.trim() || null;
    const chave = body.chave?.trim() || null;

    // ✅ situacao validada
    const situacaoOk = toSituacao(body.situacao) ?? null;

    // ✅ boolean correto (evita Boolean("false") === true)
    const haPlacaBool = toBool(body.haPlaca);
    const haPlaca = haPlacaBool === undefined ? false : haPlacaBool;

    // valor obrigatório
    if (!titulo || !cidade || body.valor === undefined || body.valor === null || body.valor === "") {
      return res.status(400).json({ error: "Campos obrigatórios" });
    }

    const imovel = await prisma.imovel.create({
      data: {
        titulo,
        cidade,
        bairro,
        endereco,
        numeroEndereco,
        cep,
        pontoReferencia,

        valor: Number(body.valor),

        areaTerrenoTotal,
        areaConstruida,
        banheiros,
        dormitorios,
        garagens,

        descricao,
        situacao: situacaoOk,
        chave,

        haPlaca,
        contatoNome,
        contatoTelefone,
      },
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
    const body = req.body || {};

    const data = {
      titulo: body.titulo ? body.titulo.trim() : undefined,
      cidade: body.cidade ? body.cidade.trim() : undefined,

      bairro: body.bairro !== undefined ? (body.bairro ? body.bairro.trim() : null) : undefined,
      endereco: body.endereco !== undefined ? (body.endereco ? body.endereco.trim() : null) : undefined,

      // ✅ aceita numeroEndereco OU numero
      numeroEndereco:
        body.numeroEndereco !== undefined || body.numero !== undefined
          ? ((body.numeroEndereco ?? body.numero ?? "").toString().trim() || null)
          : undefined,

      cep: body.cep !== undefined ? (body.cep ? body.cep.trim() : null) : undefined,

      // ✅ aceita pontoReferencia OU pontoRef
      pontoReferencia:
        body.pontoReferencia !== undefined || body.pontoRef !== undefined
          ? ((body.pontoReferencia ?? body.pontoRef ?? "").toString().trim() || null)
          : undefined,

      valor:
        body.valor !== undefined && body.valor !== null && body.valor !== ""
          ? Number(body.valor)
          : undefined,

      // ✅ aceita areaTerrenoTotal OU areaTotal
      areaTerrenoTotal:
        body.areaTerrenoTotal !== undefined || body.areaTotal !== undefined
          ? toFloat(body.areaTerrenoTotal ?? body.areaTotal)
          : undefined,

      areaConstruida: body.areaConstruida !== undefined ? toFloat(body.areaConstruida) : undefined,
      banheiros: body.banheiros !== undefined ? toInt(body.banheiros) : undefined,
      dormitorios: body.dormitorios !== undefined ? toInt(body.dormitorios) : undefined,
      garagens: body.garagens !== undefined ? toInt(body.garagens) : undefined,

      descricao: body.descricao !== undefined ? (body.descricao ? body.descricao.trim() : null) : undefined,

      // ✅ situaçao validada; se vier inválida, mantém como null (ou você pode optar por undefined)
      situacao: body.situacao !== undefined ? (toSituacao(body.situacao) ?? null) : undefined,

      chave: body.chave !== undefined ? (body.chave ? body.chave.trim() : null) : undefined,

      // ✅ boolean correto
      haPlaca: body.haPlaca !== undefined ? (toBool(body.haPlaca) ?? false) : undefined,

      // ✅ aceita contatoNome OU nomeContato
      contatoNome:
        body.contatoNome !== undefined || body.nomeContato !== undefined
          ? ((body.contatoNome ?? body.nomeContato ?? "").toString().trim() || null)
          : undefined,

      contatoTelefone:
        body.contatoTelefone !== undefined || body.telefoneContato !== undefined
          ? ((body.contatoTelefone ?? body.telefoneContato ?? "").toString().trim() || null)
          : undefined,
    };

    const imovel = await prisma.imovel.update({
      where: { id },
      data,
    });

    res.json(imovel);
  } catch (err) {
    console.error(err);
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
