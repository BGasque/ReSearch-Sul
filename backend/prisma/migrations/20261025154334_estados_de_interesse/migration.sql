-- CreateTable
CREATE TABLE `InteresseEstado` (
    `usuarioId` INTEGER NOT NULL,
    `estado` ENUM('PR', 'SC', 'RS') NOT NULL,

    PRIMARY KEY (`usuarioId`, `estado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InteresseEstado` ADD CONSTRAINT `InteresseEstado_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
