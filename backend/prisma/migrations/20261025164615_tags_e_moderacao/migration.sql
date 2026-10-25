-- AlterTable
ALTER TABLE `Conteudo` ADD COLUMN `moderadoEm` DATETIME(3) NULL,
    ADD COLUMN `motivoRecusa` TEXT NULL;

-- CreateTable
CREATE TABLE `Tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `grupo` VARCHAR(191) NOT NULL,
    `ativa` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Tag_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConteudoTag` (
    `conteudoId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,

    INDEX `ConteudoTag_tagId_idx`(`tagId`),
    PRIMARY KEY (`conteudoId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InteresseTag` (
    `usuarioId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,

    INDEX `InteresseTag_tagId_idx`(`tagId`),
    PRIMARY KEY (`usuarioId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConteudoTag` ADD CONSTRAINT `ConteudoTag_conteudoId_fkey` FOREIGN KEY (`conteudoId`) REFERENCES `Conteudo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConteudoTag` ADD CONSTRAINT `ConteudoTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InteresseTag` ADD CONSTRAINT `InteresseTag_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InteresseTag` ADD CONSTRAINT `InteresseTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
