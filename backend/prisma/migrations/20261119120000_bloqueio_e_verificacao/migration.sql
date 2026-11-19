-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "bloqueado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificado" BOOLEAN NOT NULL DEFAULT false;

-- Instituições que já existiam continuam podendo cadastrar
UPDATE "Usuario" SET "verificado" = true WHERE "tipo" = 'INSTITUICAO';
