import request from "supertest";
import express from "express";
import { getPrismaClient } from "../src/config/db";
import adocoesController from "../src/controllers/adocoesController";

// Use the same prisma instance
const prisma = getPrismaClient();

// Configurar app de teste
const app = express();
app.use(express.json());

// Rota de teste simples SEM middleware
app.get("/test", (req, res) => {
  res.json({ status: "success", message: "App is working" });
});

// Mock do middleware de autenticação que pode estar causando problema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authMiddleware = (req: any, res: any, next: any) => {
  try {
    // Mock do middleware de autenticação real - ele adiciona userId ao req.body
    req.body = {
      ...req.body,
      userId: "test-user-id", // Mesmo ID do usuário de teste
      userEmail: "testador@teste.com",
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (res && typeof res.status === "function") {
      res.status(500).json({ error: "Auth middleware failed" });
    }
  }
};

// Aplicar middleware apenas nas rotas que precisam
app.post("/adocoes", authMiddleware, adocoesController.createAdocao);
app.get("/adocoes/my-adocoes", authMiddleware, adocoesController.getMyAdocoes);
app.get("/adocoes/:id", authMiddleware, adocoesController.getAdocaoById);
app.put("/adocoes/:id", authMiddleware, adocoesController.updateAdocao);
app.patch("/adocoes/:id/adotar", authMiddleware, adocoesController.markAsAdoptado);
app.delete("/adocoes/:id", authMiddleware, adocoesController.deleteAdocao);
app.get("/adocoes", authMiddleware, adocoesController.listAdocoes);

describe("AdocoesController", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testUser: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testPet: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let testAdocao: any;

  beforeAll(async () => {
    // Limpar dados de teste (ordem importa por causa das foreign keys)
    await prisma.adocoes.deleteMany({});
    await prisma.saude.deleteMany({});
    await prisma.vacinas_pet.deleteMany({});
    await prisma.pets.deleteMany({});
    await prisma.usuarios.deleteMany({});

    // Criar usuário de teste
    testUser = await prisma.usuarios.create({
      data: {
        id: "test-user-id",
        nome: "Testador",
        email: "testador@teste.com",
        senha: "senha123",
        endereco: "Rua Teste, 123",
      },
    });

    // Criar pet de teste
    testPet = await prisma.pets.create({
      data: {
        nome: "Rex",
        especie: "CACHORRO",
        raca: "Labrador",
        porte: "GRANDE",
        genero: "MACHO",
        cor: "Dourado",
        tutor_id: testUser.id,
      },
    });
  });

  afterAll(async () => {
    // Limpar dados de teste (ordem importa por causa das foreign keys)
    await prisma.adocoes.deleteMany({});
    await prisma.saude.deleteMany({});
    await prisma.vacinas_pet.deleteMany({});
    await prisma.pets.deleteMany({});
    await prisma.usuarios.deleteMany({});
    await prisma.$disconnect();
  });

  describe("Basic tests", () => {
    it("should respond to test route", async () => {
      const response = await request(app).get("/test").expect(200);

      expect(response.body.status).toBe("success");
    });
  });

  describe("POST /adocoes", () => {
    it("deve criar um anúncio de adoção com sucesso", async () => {
      const adocaoData = {
        pet_id: testPet.id,
        descricao: "Cachorro dócil e carinhoso",
        endereco: "São Paulo, SP",
      };

      const response = await request(app).post("/adocoes").send(adocaoData).expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.message).toBe("Anúncio de adoção criado com sucesso");
      expect(response.body.data.pet_id).toBe(testPet.id);
      expect(response.body.data.descricao).toBe(adocaoData.descricao);

      testAdocao = response.body.data;
      expect(testAdocao).toBeDefined();
    });

    it("deve falhar ao tentar criar anúncio sem dados obrigatórios", async () => {
      const response = await request(app).post("/adocoes").send({}).expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Pet ID, descrição e endereço são obrigatórios");
    });
  });

  describe("GET /adocoes", () => {
    it("deve listar todas as adoções disponíveis", async () => {
      const response = await request(app).get("/adocoes");

      console.log("Response status:", response.status);
      console.log("Response body:", JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.adocoes).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.adocoes.length).toBeGreaterThanOrEqual(0);
    });
  });
});
