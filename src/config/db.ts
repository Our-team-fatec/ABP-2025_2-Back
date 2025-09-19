import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ["warn", "error"],
    });
  }
  return prisma;
}

export async function connectDB(): Promise<void> {
  const client = getPrismaClient();

  try {
    await client.$connect();
    console.log("✅ Conexão com banco estabelecida via Prisma");
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco:", error);
    process.exit(1); // encerra aplicação se não conseguir conectar
  }
}

export async function disconnectDB(): Promise<void> {
  if (!prisma) return;

  try {
    await prisma.$disconnect();
    console.log("🛑 Conexão com banco encerrada");
  } catch (error) {
    console.error("❌ Erro ao desconectar do banco:", error);
  } finally {
    prisma = null; // garante que poderá ser recriado depois se necessário
  }
}
