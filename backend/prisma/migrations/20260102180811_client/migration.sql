/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ImovelFoto` table. All the data in the column will be lost.

*/
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Imovel" ("areaConstruida", "areaTerrenoTotal", "ativo", "bairro", "banheiros", "cep", "chave", "cidade", "createdAt", "descricao", "dormitorios", "endereco", "garagens", "id", "pontoReferencia", "situacao", "status", "titulo", "updatedAt", "valor") SELECT "areaConstruida", "areaTerrenoTotal", "ativo", "bairro", "banheiros", "cep", "chave", "cidade", "createdAt", "descricao", "dormitorios", "endereco", "garagens", "id", "pontoReferencia", "situacao", "status", "titulo", "updatedAt", "valor" FROM "Imovel";
DROP TABLE "Imovel";
ALTER TABLE "new_Imovel" RENAME TO "Imovel";
CREATE TABLE "new_ImovelFoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "imovelId" TEXT NOT NULL,
    CONSTRAINT "ImovelFoto_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ImovelFoto" ("id", "imovelId", "ordem", "url") SELECT "id", "imovelId", "ordem", "url" FROM "ImovelFoto";
DROP TABLE "ImovelFoto";
ALTER TABLE "new_ImovelFoto" RENAME TO "ImovelFoto";
CREATE UNIQUE INDEX "ImovelFoto_imovelId_ordem_key" ON "ImovelFoto"("imovelId", "ordem");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
