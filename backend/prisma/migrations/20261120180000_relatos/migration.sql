-- CreateEnum
CREATE TYPE "MotivoRelato" AS ENUM ('INFORMACAO_ERRADA', 'LINK_QUEBRADO', 'DUPLICADO', 'FORA_DO_TEMA', 'OUTRO');

-- CreateEnum
CREATE TYPE "SituacaoRelato" AS ENUM ('ABERTO', 'RESOLVIDO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "Relato" (
    "id" SERIAL NOT NULL,
    "conteudoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "motivo" "MotivoRelato" NOT NULL,
    "detalhe" TEXT,
    "situacao" "SituacaoRelato" NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),
    "resolvidoPor" TEXT,

    CONSTRAINT "Relato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relato_conteudoId_idx" ON "Relato"("conteudoId");

-- CreateIndex
CREATE INDEX "Relato_usuarioId_idx" ON "Relato"("usuarioId");

-- CreateIndex
CREATE INDEX "Relato_situacao_idx" ON "Relato"("situacao");

-- AddForeignKey
ALTER TABLE "Relato" ADD CONSTRAINT "Relato_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "Conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relato" ADD CONSTRAINT "Relato_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
