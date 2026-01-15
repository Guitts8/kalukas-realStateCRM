// src/controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Usuário inválido" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Senha inválida" });

  // ✅ garante que ADMIN é ADMIN mesmo
  const isAdmin = !!user.isAdmin || user.role === "ADMIN";
  const role = isAdmin ? "ADMIN" : "USER";

  const token = jwt.sign({ id: user.id, role }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  // ✅ ajuda o frontend (se quiser salvar user/role)
  res.json({
    token,
    role,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      isAdmin,
    },
  });
};
