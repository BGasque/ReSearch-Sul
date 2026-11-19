-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "resetSenhaExpira" TIMESTAMP(3),
ADD COLUMN     "resetSenhaHash" TEXT;
