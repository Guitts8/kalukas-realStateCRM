const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

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
      createdAt: true
    }
  });

  res.json(users);
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
      createdAt: true
    }
  });

  if (!user)
    return res.status(404).json({ error: "Usuário não encontrado" });

  res.json(user);
};

/**
 * CRIAR USUÁRIO
 */
exports.criar = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(400).json({ error: "Email já cadastrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role === "ADMIN" ? "ADMIN" : "USER"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  res.status(201).json(user);
};

/**
 * ATUALIZAR USUÁRIO
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  const data = {};

  if (name) data.name = name;
  if (email) data.email = email;
  if (role) data.role = role;

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
        createdAt: true
      }
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
