import { getPrismaClient } from "../src/config/db";

const prisma = getPrismaClient();

export default async function globalSetup() {
  try {
    // Regenerar o Prisma Client para garantir que está atualizado
    console.log("🔄 Regenerando Prisma Client...");
    
    // Testar conexão com o banco
    await prisma.$connect();
    console.log("✅ Conexão com banco de dados estabelecida");
    
    // Verificar se as tabelas existem
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('usuarios', 'pets', 'adocoes', 'formularios', 'imagens')
    `;
    console.log("📋 Tabelas do sistema encontradas:", tables);
    
    if (Array.isArray(tables) && tables.length === 0) {
      console.warn("⚠️  Nenhuma tabela do sistema encontrada. Certifique-se de que as migrações foram executadas.");
    }
    
  } catch (error) {
    console.error("❌ Erro no setup dos testes:", error);
    throw error;
  }
}

export async function globalTeardown() {
  await prisma.$disconnect();
}