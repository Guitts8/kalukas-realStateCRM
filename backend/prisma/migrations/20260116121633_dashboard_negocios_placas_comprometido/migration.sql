-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImovelNegocio" (
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
    CONSTRAINT "ImovelNegocio_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);
INSERT INTO "new_ImovelNegocio" ("aluguelMensal", "aluguelMeses", "comissaoPercent", "comissaoValor", "corretorId", "createdAt", "dataOcorrencia", "id", "imovelId", "lucroImobiliaria", "observacoes", "tipo", "updatedAt", "valorBruto") SELECT "aluguelMensal", "aluguelMeses", "comissaoPercent", "comissaoValor", "corretorId", "createdAt", "dataOcorrencia", "id", "imovelId", "lucroImobiliaria", "observacoes", "tipo", "updatedAt", "valorBruto" FROM "ImovelNegocio";
DROP TABLE "ImovelNegocio";
ALTER TABLE "new_ImovelNegocio" RENAME TO "ImovelNegocio";
CREATE UNIQUE INDEX "ImovelNegocio_imovelId_key" ON "ImovelNegocio"("imovelId");
CREATE INDEX "ImovelNegocio_tipo_dataOcorrencia_idx" ON "ImovelNegocio"("tipo", "dataOcorrencia");
CREATE INDEX "ImovelNegocio_corretorId_idx" ON "ImovelNegocio"("corretorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
