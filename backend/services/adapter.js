import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

// Os dados de acesso ao banco vêm do DATABASE_URL, no arquivo .env
const url = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  host: url.hostname,
  port: Number(url.port) || 3306,
  database: url.pathname.slice(1),
  // Bancos na nuvem (como o Aiven) exigem conexão segura: DATABASE_SSL=true no .env
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  // Tempo para abrir a conexão (em milissegundos). Banco na nuvem demora mais que o do computador.
  connectTimeout: 20000,
  acquireTimeout: 30000
});
const prisma = new PrismaClient({ adapter });

export default prisma;
