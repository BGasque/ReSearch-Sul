import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// O endereço do banco (Neon, PostgreSQL) vem do DATABASE_URL, no arquivo .env.
// O próprio endereço do Neon já pede a conexão segura (sslmode=require).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // Tempo para abrir a conexão (em milissegundos). O Neon "dorme" quando ninguém usa
  // e leva alguns segundos para acordar.
  connectionTimeoutMillis: 20000,
});
const prisma = new PrismaClient({ adapter });

export default prisma;
