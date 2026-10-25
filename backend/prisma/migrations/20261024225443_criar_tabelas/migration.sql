-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PESSOA', 'INSTITUICAO', 'ADMIN') NOT NULL DEFAULT 'PESSOA',
    `lattes` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Area` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Area_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conteudo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('EVENTO', 'PUBLICACAO') NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `estado` ENUM('PR', 'SC', 'RS') NOT NULL,
    `local` VARCHAR(191) NULL,
    `autoria` VARCHAR(191) NULL,
    `dataInicio` DATETIME(3) NULL,
    `dataFim` DATETIME(3) NULL,
    `prazo` DATETIME(3) NULL,
    `linkOficial` VARCHAR(500) NOT NULL,
    `situacao` ENUM('PENDENTE', 'APROVADO', 'RECUSADO', 'ARQUIVADO') NOT NULL DEFAULT 'PENDENTE',
    `instituicaoId` INTEGER NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `Conteudo_instituicaoId_idx`(`instituicaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConteudoArea` (
    `conteudoId` INTEGER NOT NULL,
    `areaId` INTEGER NOT NULL,

    INDEX `ConteudoArea_areaId_idx`(`areaId`),
    PRIMARY KEY (`conteudoId`, `areaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interesse` (
    `usuarioId` INTEGER NOT NULL,
    `areaId` INTEGER NOT NULL,

    INDEX `Interesse_areaId_idx`(`areaId`),
    PRIMARY KEY (`usuarioId`, `areaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Conteudo` ADD CONSTRAINT `Conteudo_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConteudoArea` ADD CONSTRAINT `ConteudoArea_conteudoId_fkey` FOREIGN KEY (`conteudoId`) REFERENCES `Conteudo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConteudoArea` ADD CONSTRAINT `ConteudoArea_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `Area`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Interesse` ADD CONSTRAINT `Interesse_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Interesse` ADD CONSTRAINT `Interesse_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `Area`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
