// Cópia de segurança (RNF11): salva todas as tabelas do banco num arquivo .json.
//
// Uso (na pasta backend):
//   npm run backup                          -> banco do .env (computador)
//   node --env-file=.env.producao scripts/backup.js   -> banco do site no ar
//
// O arquivo vai para backend/backups/ (essa pasta não vai para o GitHub, porque tem dados pessoais).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prisma from '../services/adapter.js';
import { TABELAS } from './tabelas.js';

const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'backups');

async function main() {
    const dados = {};
    for (const { modelo } of TABELAS) {
        dados[modelo] = await prisma[modelo].findMany();
    }

    fs.mkdirSync(pasta, { recursive: true });
    const agora = new Date();
    const nome = `backup-${agora.toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
    const arquivo = path.join(pasta, nome);
    fs.writeFileSync(arquivo, JSON.stringify({ criadoEm: agora, versao: 1, dados }, null, 2));

    console.log(`Cópia salva em backups/${nome}`);
    for (const { modelo } of TABELAS) console.log(`  ${modelo}: ${dados[modelo].length}`);
}

main()
    .catch((erro) => {
        console.error('Erro ao fazer a cópia:', erro.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
