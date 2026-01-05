/*
  Warnings:

  - You are about to drop the column `cor` on the `Imovel` table. All the data in the column will be lost.
  - You are about to drop the column `metrosQuadrados` on the `Imovel` table. All the data in the column will be lost.
  - You are about to drop the column `referencia` on the `Imovel` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `ImovelUser` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ImovelFoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImovelFoto_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Imovel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "bairro" TEXT,
    "endereco" TEXT,
    "cep" TEXT,
    "pontoReferencia" TEXT,
    "valor" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "areaTerrenoTotal" REAL,
    "areaConstruida" REAL,
    "banheiros" INTEGER,
    "dormitorios" INTEGER,
    "garagens" INTEGER,
    "descricao" TEXT,
    "situacao" TEXT,
    "chave" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Imovel" ("ativo", "bairro", "cidade", "createdAt", "endereco", "id", "titulo", "valor") SELECT "ativo", "bairro", "cidade", "createdAt", "endereco", "id", "titulo", "valor" FROM "Imovel";
DROP TABLE "Imovel";
ALTER TABLE "new_Imovel" RENAME TO "Imovel";
CREATE TABLE "new_ImovelUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imovelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImovelUser_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImovelUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ImovelUser" ("id", "imovelId", "userId") SELECT "id", "imovelId", "userId" FROM "ImovelUser";
DROP TABLE "ImovelUser";
ALTER TABLE "new_ImovelUser" RENAME TO "ImovelUser";
CREATE UNIQUE INDEX "ImovelUser_imovelId_userId_tipo_key" ON "ImovelUser"("imovelId", "userId", "tipo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
