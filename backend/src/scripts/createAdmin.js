const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@crm.com",
      password: passwordHash,
      role: "ADMIN"
    }
  });

  console.log("✅ Usuário criado:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

  //comentar linhas de suporte
