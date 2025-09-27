import request from "supertest";
import express from "express";

// Mock do Prisma deve vir antes dos imports que usam o Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  getPrismaClient: () => mockPrisma,
}));

// Mock do bcrypt para testes de senha
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

// Mock do JWT Service
jest.mock("../src/utils/jwtService", () => ({
  generateToken: jest.fn().mockReturnValue("mock-jwt-token"),
  verifyToken: jest.fn(),
}));

import authController from "../src/controllers/authController";
import bcrypt from "bcrypt";
import jwtService from "../src/utils/jwtService";

const app = express();
app.use(express.json());
app.post("/api/auth/login", authController.login);
app.post("/api/auth/refresh-token", authController.refreshToken);

describe("AuthController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("deve fazer login com sucesso", async () => {
      // Arrange
      const loginData = {
        email: "joao@example.com",
        senha: "123456",
      };

      const mockUser = {
        id: "user-uuid",
        name: "João Silva",
        email: "joao@example.com",
        endereco: "Rua das Flores, 123",
        grupo: 0,
        senha: "hashed-password",
        criadoEm: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.generateToken as jest.Mock).mockReturnValue("mock-jwt-token");

      // Act
      const response = await request(app).post("/api/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.message).toBe("Login realizado com sucesso");
      expect(response.body.data).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          endereco: mockUser.endereco,
          grupo: mockUser.grupo,
          criadoEm: expect.any(String),
        },
        accessToken: "mock-jwt-token",
        refreshToken: "mock-jwt-token",
      });
      expect(response.body.data.user).not.toHaveProperty("senha");
    });

    it("deve retornar erro para campos obrigatórios faltando", async () => {
      // Arrange
      const incompleteData = {
        email: "joao@example.com",
        // senha faltando
      };

      // Act
      const response = await request(app).post("/api/auth/login").send(incompleteData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Email e senha são obrigatórios");
      expect(response.body.code).toBe(400);
    });

    it("deve retornar erro para email inválido", async () => {
      // Arrange
      const invalidEmailData = {
        email: "email-invalido",
        senha: "123456",
      };

      // Act
      const response = await request(app).post("/api/auth/login").send(invalidEmailData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Formato de email inválido");
      expect(response.body.code).toBe(400);
    });

    it("deve retornar erro para usuário não encontrado", async () => {
      // Arrange
      const loginData = {
        email: "naoexiste@example.com",
        senha: "123456",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const response = await request(app).post("/api/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Credenciais inválidas");
      expect(response.body.code).toBe(401);
    });

    it("deve retornar erro para senha incorreta", async () => {
      // Arrange
      const loginData = {
        email: "joao@example.com",
        senha: "senhaerrada",
      };

      const mockUser = {
        id: "user-uuid",
        name: "João Silva",
        email: "joao@example.com",
        endereco: "Rua das Flores, 123",
        grupo: 0,
        senha: "hashed-password",
        criadoEm: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const response = await request(app).post("/api/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Credenciais inválidas");
      expect(response.body.code).toBe(401);
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("deve renovar token com sucesso", async () => {
      // Arrange
      const refreshTokenData = {
        refreshToken: "valid-refresh-token",
      };

      const mockPayload = {
        userId: "user-123",
        email: "test@example.com",
        grupo: 0,
      };

      (jwtService.verifyToken as jest.Mock).mockReturnValue(mockPayload);
      (jwtService.generateToken as jest.Mock).mockReturnValue("new-access-token");

      // Act
      const response = await request(app).post("/api/auth/refresh-token").send(refreshTokenData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.message).toBe("Token renovado com sucesso");
      expect(response.body.data).toEqual({
        accessToken: "new-access-token",
      });
      expect(jwtService.verifyToken).toHaveBeenCalledWith("valid-refresh-token");
      expect(jwtService.generateToken).toHaveBeenCalledWith(mockPayload);
    });

    it("deve retornar erro quando refresh token não é fornecido", async () => {
      // Arrange
      const emptyData = {};

      // Act
      const response = await request(app).post("/api/auth/refresh-token").send(emptyData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Refresh token não fornecido");
      expect(response.body.code).toBe(400);
    });

    it("deve retornar erro para refresh token inválido", async () => {
      // Arrange
      const invalidTokenData = {
        refreshToken: "invalid-refresh-token",
      };

      (jwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error("Token inválido");
      });

      // Act
      const response = await request(app).post("/api/auth/refresh-token").send(invalidTokenData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Refresh token inválido ou expirado");
      expect(response.body.code).toBe(401);
    });

    it("deve retornar erro para refresh token expirado", async () => {
      // Arrange
      const expiredTokenData = {
        refreshToken: "expired-refresh-token",
      };

      (jwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error("Token expirado");
      });

      // Act
      const response = await request(app).post("/api/auth/refresh-token").send(expiredTokenData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Refresh token inválido ou expirado");
      expect(response.body.code).toBe(401);
    });
  });
});
