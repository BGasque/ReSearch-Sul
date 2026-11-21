// Restaurar uma cópia de segurança (RNF11).
// ATENÇÃO: APAGA tudo o que está no banco e coloca no lugar o que está no arquivo.
//
// Uso (na pasta backend):
//   node --env-file=.env scripts/restaurar.js backups/backup-AAAA-MM-DD-HH-MM.json --confirmar
//
// Sem "--confirmar" ele só mostra o que faria, sem mudar nada.
// Tudo acontece numa transação: se der qualquer erro no meio, nada é alterado.
import fs from 'node:fs';
import { Prisma } from '@prisma/client';
import prisma from '../services/adapter.js';
import { TABELAS } from './tabelas.js';

const [arquivo, confirmacao] = process.argv.slice(2);

async function main() {
    if (!arquivo || !fs.existsSync(arquivo)) {
        console.log('Informe o arquivo da cópia. Ex.: node --env-file=.env scripts/restaurar.js backups/backup-2026-11-20-18-00.json --confirmar');
        process.exitCode = 1;
        return;
    }

    const { criadoEm, dados } = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    console.log(`Cópia feita em ${criadoEm}:`);
    for (const { modelo } of TABELAS) console.log(`  ${modelo}: ${(dados[modelo] || []).length}`);

    if (confirmacao !== '--confirmar') {
        console.log('\nNada foi alterado. Para restaurar de verdade, rode de novo com --confirmar no final.');
        return;
    }

    await prisma.$transaction(async (tx) => {
        // 1. Apaga tudo, das tabelas que dependem para as principais
        for (const { modelo } of [...TABELAS].reverse()) {
            await tx[modelo].deleteMany();
        }

        // 2. Recria na ordem certa
        for (const { modelo } of TABELAS) {
            let linhas = dados[modelo] || [];
            // Campo JSON vazio precisa de um valor especial no Prisma
            if (modelo === 'usuario') {
                linhas = linhas.map((linha) => ({ ...linha, lattesDados: linha.lattesDados ?? Prisma.DbNull }));
            }
            if (linhas.length > 0) await tx[modelo].createMany({ data: linhas });
        }

        // 3. Acerta os números automáticos (o próximo id continua depois do maior)
        for (const { tabela, comId } of TABELAS) {
            if (!comId) continue;
            await tx.$executeRawUnsafe(
                `SELECT setval(pg_get_serial_sequence('"${tabela}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tabela}"), 1), (SELECT MAX(id) FROM "${tabela}") IS NOT NULL)`
            );
        }
    }, { timeout: 120000, maxWait: 30000 });

    console.log('\nCópia restaurada.');
}

main()
    .catch((erro) => {
        console.error('Erro ao restaurar (nada foi alterado):', erro.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
