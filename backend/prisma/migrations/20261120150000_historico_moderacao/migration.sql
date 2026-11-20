-- CreateEnum
CREATE TYPE "AcaoModeracao" AS ENUM ('APROVOU', 'RECUSOU', 'PEDIU_CORRECAO', 'EDITOU', 'OCULTOU', 'ARQUIVOU');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Situacao" ADD VALUE 'CORRECAO';
ALTER TYPE "Situacao" ADD VALUE 'OCULTO';

-- CreateTable
CREATE TABLE "Decisao" (
    "id" SERIAL NOT NULL,
    "conteudoId" INTEGER NOT NULL,
    "adminId" INTEGER,
    "adminNome" TEXT NOT NULL,
    "acao" "AcaoModeracao" NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Decisao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Decisao_conteudoId_idx" ON "Decisao"("conteudoId");

-- CreateIndex
CREATE INDEX "Decisao_adminId_idx" ON "Decisao"("adminId");

-- AddForeignKey
ALTER TABLE "Decisao" ADD CONSTRAINT "Decisao_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "Conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decisao" ADD CONSTRAINT "Decisao_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
