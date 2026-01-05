-- DropIndex
DROP INDEX "ImovelFoto_imovelId_ordem_key";

-- CreateIndex
CREATE INDEX "ImovelFoto_imovelId_ordem_idx" ON "ImovelFoto"("imovelId", "ordem");
