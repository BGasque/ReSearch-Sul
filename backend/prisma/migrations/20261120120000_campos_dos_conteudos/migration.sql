-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('PRESENCIAL', 'ONLINE', 'HIBRIDO');

-- CreateEnum
CREATE TYPE "FormaAcesso" AS ENUM ('GRATUITO', 'PAGO');

-- CreateEnum
CREATE TYPE "TipoPublicacao" AS ENUM ('REVISTA', 'EDICAO', 'CHAMADA', 'ARTIGO', 'ANAIS', 'LIVRO', 'OUTRA');

-- AlterTable
ALTER TABLE "Conteudo" ADD COLUMN     "acesso" "FormaAcesso",
ADD COLUMN     "ano" INTEGER,
ADD COLUMN     "doi" TEXT,
ADD COLUMN     "issn" TEXT,
ADD COLUMN     "modalidade" "Modalidade",
ADD COLUMN     "publicoAlvo" TEXT,
ADD COLUMN     "tipoPublicacao" "TipoPublicacao";

-- Preenche a modalidade dos eventos que já existiam, olhando o local
UPDATE "Conteudo" SET "modalidade" = 'ONLINE'
WHERE "tipo" = 'EVENTO' AND "modalidade" IS NULL AND unaccent(coalesce("local", '')) ILIKE '%online%';
UPDATE "Conteudo" SET "modalidade" = 'PRESENCIAL'
WHERE "tipo" = 'EVENTO' AND "modalidade" IS NULL;

-- Preenche o tipo das publicações que já existiam, olhando o título e a autoria
UPDATE "Conteudo" SET "tipoPublicacao" = 'CHAMADA'
WHERE "tipo" = 'PUBLICACAO' AND "tipoPublicacao" IS NULL AND unaccent("titulo") ILIKE '%chamada%';
UPDATE "Conteudo" SET "tipoPublicacao" = 'ANAIS'
WHERE "tipo" = 'PUBLICACAO' AND "tipoPublicacao" IS NULL AND unaccent("titulo") ILIKE '%anais%';
UPDATE "Conteudo" SET "tipoPublicacao" = 'REVISTA'
WHERE "tipo" = 'PUBLICACAO' AND "tipoPublicacao" IS NULL
  AND (unaccent("titulo") ILIKE '%revista%' OR unaccent(coalesce("autoria", '')) ILIKE '%revista%');
UPDATE "Conteudo" SET "tipoPublicacao" = 'OUTRA'
WHERE "tipo" = 'PUBLICACAO' AND "tipoPublicacao" IS NULL;
