const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function toBool(v) {
  if (v === true || v === false) return v;
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0) return false;
  return undefined;
}

/**
 * LISTAR USUÁRIOS
 */
exports.listar = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isAdmin: true, // ✅
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // ✅ garante consistência na resposta
  const normalized = users.map((u) => {
    const isAdmin = !!u.isAdmin || u.role === "ADMIN";
    return { ...u, isAdmin, role: isAdmin ? "ADMIN" : "USER" };
  });

  res.json(normalized);
};

/**
 * BUSCAR USUÁRIO POR ID
 */
exports.buscarPorId = async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isAdmin: true, // ✅
      createdAt: true,
    },
  });

  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const isAdmin = !!user.isAdmin || user.role === "ADMIN";
  res.json({ ...user, isAdmin, role: isAdmin ? "ADMIN" : "USER" });
};

/**
 * CRIAR USUÁRIO
 */
exports.criar = async (req, res) => {
  const { name, email, password } = req.body;
  const isAdmin = toBool(req.body?.isAdmin) ?? false;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(400).json({ error: "Email já cadastrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const role = isAdmin ? "ADMIN" : "USER";

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      isAdmin,
      role, // ✅ sempre sincronizado
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  res.status(201).json(user);
};

/**
 * ATUALIZAR USUÁRIO
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  const data = {};

  if (name) data.name = name;
  if (email) data.email = email;

  // ✅ switch admin
  const isAdmin = toBool(req.body?.isAdmin);
  if (typeof isAdmin === "boolean") {
    data.isAdmin = isAdmin;
    data.role = isAdmin ? "ADMIN" : "USER";
  }

  // ✅ senha opcional
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
};

/**
 * EXCLUIR USUÁRIO
 */
exports.remover = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
};
