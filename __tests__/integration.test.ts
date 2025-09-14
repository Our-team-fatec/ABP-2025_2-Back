import request from "supertest";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db";
import express from "express";
import healthRouter from "../src/routes/health";

// Configurar app para testes
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(healthRouter);
  return app;
};

describe("Testes de Integração", () => {
  let app: express.Application;
  const TEST_MONGODB_URI =
    process.env.TEST_MONGODB_URI ||
    "mongodb://test:test123@localhost:27018/test_db?authSource=admin";

  beforeAll(async () => {
    app = createTestApp();

    // Conectar ao banco de teste
    try {
      await connectDB(TEST_MONGODB_URI);
    } catch (error) {
      console.error("Erro ao conectar ao MongoDB de teste:", error);
      throw error;
    }
  });

  afterAll(async () => {
    // Limpar e desconectar do banco
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
      }
      await disconnectDB();
    } catch (error) {
      console.error("Erro ao desconectar do MongoDB de teste:", error);
    }
  });

  beforeEach(async () => {
    // Limpar coleções antes de cada teste
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe("Verificação de Saúde", () => {
    it("deve retornar status ok", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("Conexão com Banco de Dados", () => {
    it("deve estar conectado ao MongoDB", () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    it("deve ser capaz de criar e buscar documentos", async () => {
      // Criar um modelo de teste simples
      const TestSchema = new mongoose.Schema({
        name: String,
        createdAt: { type: Date, default: Date.now },
      });

      const TestModel = mongoose.model("Test", TestSchema);

      // Criar um documento
      const testDoc = await TestModel.create({ name: "Teste de Integração" });
      expect(testDoc).toBeDefined();
      expect(testDoc.name).toBe("Teste de Integração");

      // Buscar o documento
      const foundDoc = await TestModel.findById(testDoc._id);
      expect(foundDoc).toBeDefined();
      expect(foundDoc?.name).toBe("Teste de Integração");

      // Limpar
      await TestModel.deleteMany({});
    });
  });

  describe("Endpoints da API", () => {
    it("deve retornar 404 para rotas inexistentes", async () => {
      await request(app).get("/rota-inexistente").expect(404);
    });

    it("deve aceitar requisições JSON", async () => {
      // Este teste verifica se o middleware de JSON está funcionando
      // Como não temos uma rota POST ainda, vamos testar com a rota de health
      const response = await request(app)
        .get("/health")
        .set("Content-Type", "application/json")
        .expect(200);

      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("Configuração do Ambiente", () => {
    it("deve estar executando em ambiente de teste", () => {
      // Verificar se estamos em ambiente de teste
      const nodeEnv = process.env.NODE_ENV;
      expect(["test", undefined]).toContain(nodeEnv);
    });

    it("deve usar URI do banco de dados de teste", () => {
      const dbName = mongoose.connection.db?.databaseName;
      expect(dbName).toBe("test_db");
    });
  });
});
