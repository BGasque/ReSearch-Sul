-- AlterTable
ALTER TABLE `Conteudo` ADD COLUMN `publicadoEm` DATETIME(3) NULL;

-- Conteúdos que já estavam aprovados contam como publicados
UPDATE `Conteudo` SET `publicadoEm` = `criadoEm` WHERE `situacao` = 'APROVADO';
