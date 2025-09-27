import request from "supertest";
import express from "express";

// Mock do Prisma deve vir antes dos imports que usam o Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  getPrismaClient: () => mockPrisma,
}));

import usersRouter from "../src/routes/usersRoutes";

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

describe("POST /api/users/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve cadastrar um usuário com sucesso", async () => {
    // Arrange
    const userData = {
      name: "João Silva",
      email: "joao@example.com",
      endereco: "Rua das Flores, 123",
      senha: "123456",
    };

    const expectedUser = {
      id: "user-uuid",
      name: userData.name,
      email: userData.email,
      endereco: userData.endereco,
      grupo: 0,
      criadoEm: new Date(),
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(expectedUser);

    // Act
    const response = await request(app).post("/api/users/register").send(userData);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Usuário cadastrado com sucesso");
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: expectedUser.id,
        name: expectedUser.name,
        email: expectedUser.email,
        endereco: expectedUser.endereco,
        grupo: expectedUser.grupo,
        criadoEm: expect.any(String),
      }),
    );
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: userData.email },
    });
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        name: userData.name,
        email: userData.email,
        endereco: userData.endereco,
        senha: expect.any(String), // senha deve estar hasheada
        grupo: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        endereco: true,
        grupo: true,
        criadoEm: true,
      },
    });
  });

  it("deve retornar erro para campos obrigatórios faltando", async () => {
    // Arrange
    const incompleteData = {
      name: "João Silva",
      // faltando email, endereco e senha
    };

    // Act
    const response = await request(app).post("/api/users/register").send(incompleteData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Todos os campos são obrigatórios");
    expect(response.body.code).toBe(400);
  });

  it("deve retornar erro para email inválido", async () => {
    // Arrange
    const invalidEmailData = {
      name: "João Silva",
      email: "email-invalido",
      endereco: "Rua das Flores, 123",
      senha: "123456",
    };

    // Act
    const response = await request(app).post("/api/users/register").send(invalidEmailData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Formato de email inválido");
    expect(response.body.code).toBe(400);
  });

  it("deve retornar erro para senha muito curta", async () => {
    // Arrange
    const shortPasswordData = {
      name: "João Silva",
      email: "joao@example.com",
      endereco: "Rua das Flores, 123",
      senha: "123",
    };

    // Act
    const response = await request(app).post("/api/users/register").send(shortPasswordData);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("A senha deve ter pelo menos 6 caracteres");
    expect(response.body.code).toBe(400);
  });

  it("deve retornar erro para email já cadastrado", async () => {
    // Arrange
    const userData = {
      name: "João Silva",
      email: "joao@example.com",
      endereco: "Rua das Flores, 123",
      senha: "123456",
    };

    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing-user" });

    // Act
    const response = await request(app).post("/api/users/register").send(userData);

    // Assert
    expect(response.status).toBe(409);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Email já cadastrado");
    expect(response.body.code).toBe(409);
  });

  it("deve retornar erro 500 para erro interno", async () => {
    // Arrange
    const userData = {
      name: "João Silva",
      email: "joao@example.com",
      endereco: "Rua das Flores, 123",
      senha: "123456",
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockRejectedValue(new Error("Database error"));

    // Act
    const response = await request(app).post("/api/users/register").send(userData);

    // Assert
    expect(response.status).toBe(500);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Erro interno do servidor");
    expect(response.body.code).toBe(500);
  });
});
