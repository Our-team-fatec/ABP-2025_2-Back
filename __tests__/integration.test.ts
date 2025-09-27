import request from "supertest";
import { PrismaClient } from "../src/generated/prisma";
import express from "express";
import healthRouter from "../src/routes/healthRoutes";

const prisma = new PrismaClient();

// Configurar app para testes
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(healthRouter);
  return app;
};

describe("Testes de Integração", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createTestApp();
    try {
      // Testar conexão com banco
      await prisma.$connect();
    } catch (error) {
      console.error("Erro ao conectar ao Postgres de teste:", error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Limpa o banco e fecha conexão
      await prisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
      await prisma.$disconnect();
    } catch (error) {
      console.error("Erro ao desconectar do Postgres de teste:", error);
    }
  });

  beforeEach(async () => {
    // Limpa todas as tabelas antes de cada teste
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public';
    `;
    for (const { tablename } of tablenames) {
      if (tablename !== "_prisma_migrations") {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`);
      }
    }
  });

  describe("Verificação de Saúde", () => {
    it("deve retornar status ok", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("Endpoints da API", () => {
    it("deve retornar 404 para rotas inexistentes", async () => {
      await request(app).get("/rota-inexistente").expect(404);
    });

    it("deve aceitar requisições JSON", async () => {
      const response = await request(app)
        .get("/health")
        .set("Content-Type", "application/json")
        .expect(200);

      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("Configuração do Ambiente", () => {
    it("deve estar executando em ambiente de teste", () => {
      const nodeEnv = process.env.NODE_ENV;
      expect(["test", undefined]).toContain(nodeEnv);
    });

    it("deve usar banco de dados de teste", async () => {
      const result = await prisma.$queryRaw<{ current_database: string }[]>`
        SELECT current_database() as current_database;
      `;
      expect(result[0].current_database).toBe("davinci_pets");
    });
  });
});
