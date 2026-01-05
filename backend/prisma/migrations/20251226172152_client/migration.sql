-- AlterTable
ALTER TABLE "Imovel" ADD COLUMN "bairro" TEXT;
ALTER TABLE "Imovel" ADD COLUMN "cor" TEXT;
ALTER TABLE "Imovel" ADD COLUMN "endereco" TEXT;
ALTER TABLE "Imovel" ADD COLUMN "metrosQuadrados" INTEGER;
ALTER TABLE "Imovel" ADD COLUMN "referencia" TEXT;

-- CreateTable
CREATE TABLE "ImovelUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    CONSTRAINT "ImovelUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ImovelUser_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ImovelUser_userId_imovelId_key" ON "ImovelUser"("userId", "imovelId");
