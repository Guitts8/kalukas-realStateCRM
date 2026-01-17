-- CreateTable
CREATE TABLE "ImovelNegocio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imovelId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataOcorrencia" DATETIME NOT NULL,
    "corretorId" TEXT NOT NULL,
    "comissaoPercent" REAL NOT NULL,
    "comissaoValor" REAL NOT NULL,
    "valorBruto" REAL NOT NULL,
    "lucroImobiliaria" REAL NOT NULL,
    "aluguelMensal" REAL,
    "aluguelMeses" INTEGER,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImovelNegocio_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImovelNegocio_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "placaAt" DATETIME,
    "placaByUserId" TEXT,
    "comprometidoAt" DATETIME,
    "comprometidoByUserId" TEXT,
    "contatoNome" TEXT,
    "contatoTelefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Imovel_placaByUserId_fkey" FOREIGN KEY ("placaByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Imovel_comprometidoByUserId_fkey" FOREIGN KEY ("comprometidoByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Imovel" ("areaConstruida", "areaTerrenoTotal", "ativo", "bairro", "banheiros", "cep", "chave", "cidade", "contatoNome", "contatoTelefone", "createdAt", "descricao", "dormitorios", "endereco", "garagens", "haPlaca", "id", "numeroEndereco", "pontoReferencia", "situacao", "status", "titulo", "updatedAt", "valor") SELECT "areaConstruida", "areaTerrenoTotal", "ativo", "bairro", "banheiros", "cep", "chave", "cidade", "contatoNome", "contatoTelefone", "createdAt", "descricao", "dormitorios", "endereco", "garagens", "haPlaca", "id", "numeroEndereco", "pontoReferencia", "situacao", "status", "titulo", "updatedAt", "valor" FROM "Imovel";
DROP TABLE "Imovel";
ALTER TABLE "new_Imovel" RENAME TO "Imovel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ImovelNegocio_imovelId_key" ON "ImovelNegocio"("imovelId");

-- CreateIndex
CREATE INDEX "ImovelNegocio_tipo_dataOcorrencia_idx" ON "ImovelNegocio"("tipo", "dataOcorrencia");

-- CreateIndex
CREATE INDEX "ImovelNegocio_corretorId_idx" ON "ImovelNegocio"("corretorId");
