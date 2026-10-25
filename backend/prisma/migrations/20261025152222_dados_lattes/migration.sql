-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `lattesDados` JSON NULL,
    ADD COLUMN `lattesId` VARCHAR(191) NULL,
    ADD COLUMN `lattesImportadoEm` DATETIME(3) NULL;
