/*
  Warnings:

  - You are about to drop the column `placaAt` on the `Imovel` table. All the data in the column will be lost.
  - You are about to drop the column `placaByUserId` on the `Imovel` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ImovelNegocio` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ImovelPlacaEvento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imovelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImovelPlacaEvento_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImovelPlacaEvento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "numeroEndereco" TEXT,
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
    "situacao" TEXT NOT NULL DEFAULT 'INATIVO',
    "chave" TEXT,
    "haPlaca" BOOLEAN NOT NULL DEFAULT false,
    "contatoNome" TEXT,
    "contatoTelefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "comprometidoAt" DATETIME,
    "comprometidoByUserId" TEXT,
    CONSTRAINT "Imovel_comprometidoByUserId_fkey" FOREIGN KEY ("comprometidoByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Imovel" ("areaConstruida", "areaTerrenoTotal", "ativo", "bairro", "banheiros", "cep", "chave", "cidade", "comprometidoAt", "comprometidoByUserId", "contatoNome", "contatoTelefone", "createdAt", "descricao", "dormitorios", "endereco", "garagens", "haPlaca", "id", "numeroEndereco", "pontoReferencia", "situacao", "status", "titulo", "updatedAt", "valor") SELECT "areaConstruida", "areaTerrenoTotal", "ativo", "bairro", "banheiros", "cep", "chave", "cidade", "comprometidoAt", "comprometidoByUserId", "contatoNome", "contatoTelefone", "createdAt", "descricao", "dormitorios", "endereco", "garagens", "haPlaca", "id", "numeroEndereco", "pontoReferencia", "situacao", "status", "titulo", "updatedAt", "valor" FROM "Imovel";
DROP TABLE "Imovel";
ALTER TABLE "new_Imovel" RENAME TO "Imovel";
CREATE TABLE "new_ImovelNegocio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imovelId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataOcorrencia" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corretorId" TEXT NOT NULL,
    "valorBruto" REAL NOT NULL,
    "comissaoPercent" REAL,
    "comissaoValor" REAL NOT NULL,
    "lucroImobiliaria" REAL,
    "aluguelMensal" REAL,
    "aluguelMeses" INTEGER,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImovelNegocio_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "ImovelNegocio_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ImovelNegocio" ("aluguelMensal", "aluguelMeses", "comissaoPercent", "comissaoValor", "corretorId", "createdAt", "dataOcorrencia", "id", "imovelId", "lucroImobiliaria", "observacoes", "tipo", "valorBruto") SELECT "aluguelMensal", "aluguelMeses", "comissaoPercent", "comissaoValor", "corretorId", "createdAt", "dataOcorrencia", "id", "imovelId", "lucroImobiliaria", "observacoes", "tipo", "valorBruto" FROM "ImovelNegocio";
DROP TABLE "ImovelNegocio";
ALTER TABLE "new_ImovelNegocio" RENAME TO "ImovelNegocio";
CREATE UNIQUE INDEX "ImovelNegocio_imovelId_key" ON "ImovelNegocio"("imovelId");
CREATE INDEX "ImovelNegocio_tipo_dataOcorrencia_idx" ON "ImovelNegocio"("tipo", "dataOcorrencia");
CREATE INDEX "ImovelNegocio_corretorId_dataOcorrencia_idx" ON "ImovelNegocio"("corretorId", "dataOcorrencia");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ImovelPlacaEvento_createdAt_idx" ON "ImovelPlacaEvento"("createdAt");

-- CreateIndex
CREATE INDEX "ImovelPlacaEvento_acao_createdAt_idx" ON "ImovelPlacaEvento"("acao", "createdAt");

-- CreateIndex
CREATE INDEX "ImovelPlacaEvento_userId_createdAt_idx" ON "ImovelPlacaEvento"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ImovelPlacaEvento_imovelId_createdAt_idx" ON "ImovelPlacaEvento"("imovelId", "createdAt");
