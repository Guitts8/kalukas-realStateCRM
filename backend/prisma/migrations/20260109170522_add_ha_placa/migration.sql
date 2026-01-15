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
    "haPlaca" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Imovel" ("areaConstruida", "areaTerrenoTotal", "ativo", "bairro", "banheiros", "cep", "chave", "cidade", "createdAt", "descricao", "dormitorios", "endereco", "garagens", "id", "pontoReferencia", "situacao", "status", "titulo", "updatedAt", "valor") SELECT "areaConstruida", "areaTerrenoTotal", "ativo", "bairro", "banheiros", "cep", "chave", "cidade", "createdAt", "descricao", "dormitorios", "endereco", "garagens", "id", "pontoReferencia", "situacao", "status", "titulo", "updatedAt", "valor" FROM "Imovel";
DROP TABLE "Imovel";
ALTER TABLE "new_Imovel" RENAME TO "Imovel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
