-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "ativa" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- Cria uma categoria para cada grupo que as tags já usam
INSERT INTO "Categoria" ("nome") SELECT DISTINCT "grupo" FROM "Tag" ON CONFLICT ("nome") DO NOTHING;
