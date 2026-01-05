-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImovelFoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "imovelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImovelFoto_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ImovelFoto" ("createdAt", "id", "imovelId", "url") SELECT "createdAt", "id", "imovelId", "url" FROM "ImovelFoto";
DROP TABLE "ImovelFoto";
ALTER TABLE "new_ImovelFoto" RENAME TO "ImovelFoto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
