-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('PESSOA', 'INSTITUICAO', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoConteudo" AS ENUM ('EVENTO', 'PUBLICACAO');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('PR', 'SC', 'RS');

-- CreateEnum
CREATE TYPE "Situacao" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'ARQUIVADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo" "TipoConta" NOT NULL DEFAULT 'PESSOA',
    "lattes" TEXT,
    "lattesId" TEXT,
    "lattesDados" JSONB,
    "lattesImportadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conteudo" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoConteudo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "estado" "Estado" NOT NULL,
    "local" TEXT,
    "autoria" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "prazo" TIMESTAMP(3),
    "linkOficial" VARCHAR(500) NOT NULL,
    "situacao" "Situacao" NOT NULL DEFAULT 'PENDENTE',
    "instituicaoId" INTEGER NOT NULL,
    "publicadoEm" TIMESTAMP(3),
    "motivoRecusa" TEXT,
    "moderadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conteudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConteudoArea" (
    "conteudoId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,

    CONSTRAINT "ConteudoArea_pkey" PRIMARY KEY ("conteudoId","areaId")
);

-- CreateTable
CREATE TABLE "Interesse" (
    "usuarioId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,

    CONSTRAINT "Interesse_pkey" PRIMARY KEY ("usuarioId","areaId")
);

-- CreateTable
CREATE TABLE "InteresseEstado" (
    "usuarioId" INTEGER NOT NULL,
    "estado" "Estado" NOT NULL,

    CONSTRAINT "InteresseEstado_pkey" PRIMARY KEY ("usuarioId","estado")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConteudoTag" (
    "conteudoId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ConteudoTag_pkey" PRIMARY KEY ("conteudoId","tagId")
);

-- CreateTable
CREATE TABLE "InteresseTag" (
    "usuarioId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "InteresseTag_pkey" PRIMARY KEY ("usuarioId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Area_nome_key" ON "Area"("nome");

-- CreateIndex
CREATE INDEX "Conteudo_instituicaoId_idx" ON "Conteudo"("instituicaoId");

-- CreateIndex
CREATE INDEX "ConteudoArea_areaId_idx" ON "ConteudoArea"("areaId");

-- CreateIndex
CREATE INDEX "Interesse_areaId_idx" ON "Interesse"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_nome_key" ON "Tag"("nome");

-- CreateIndex
CREATE INDEX "ConteudoTag_tagId_idx" ON "ConteudoTag"("tagId");

-- CreateIndex
CREATE INDEX "InteresseTag_tagId_idx" ON "InteresseTag"("tagId");

-- AddForeignKey
ALTER TABLE "Conteudo" ADD CONSTRAINT "Conteudo_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConteudoArea" ADD CONSTRAINT "ConteudoArea_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "Conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConteudoArea" ADD CONSTRAINT "ConteudoArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interesse" ADD CONSTRAINT "Interesse_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interesse" ADD CONSTRAINT "Interesse_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteresseEstado" ADD CONSTRAINT "InteresseEstado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConteudoTag" ADD CONSTRAINT "ConteudoTag_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "Conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConteudoTag" ADD CONSTRAINT "ConteudoTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteresseTag" ADD CONSTRAINT "InteresseTag_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteresseTag" ADD CONSTRAINT "InteresseTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
