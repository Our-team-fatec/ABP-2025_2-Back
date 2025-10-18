import { Request, Response } from "express";

// Mock do Prisma antes de importar o controller
const mockPrisma = {
  saude: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  pets: {
    findFirst: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  getPrismaClient: () => mockPrisma,
}));

// Importar o controller após o mock
import saudeController from "../src/controllers/saudeController";

// Mocks para Request e Response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRequest = (body: any = {}, params: any = {}) =>
  ({
    body,
    params,
  }) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("SaudeController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSaude", () => {
    it("deve criar um registro de saúde com sucesso", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        castrado: true,
        userId: "user-123",
      });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockSaude = {
        id: "saude-123",
        pet_id: "pet-123",
        castrado: true,
        criado_em: new Date(),
        atualizado_em: new Date(),
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.saude.findUnique.mockResolvedValue(null);
      mockPrisma.saude.create.mockResolvedValue(mockSaude);

      await saudeController.createSaude(req, res);

      expect(mockPrisma.pets.findFirst).toHaveBeenCalledWith({
        where: {
          id: "pet-123",
          tutor_id: "user-123",
          removido_em: null,
        },
      });
      expect(mockPrisma.saude.create).toHaveBeenCalledWith({
        data: {
          pet_id: "pet-123",
          castrado: true,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registro de saúde criado com sucesso",
          data: expect.objectContaining({ saude: mockSaude }),
        }),
      );
    });

    it("deve retornar 401 se usuário não estiver autenticado", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        castrado: true,
      });
      const res = mockResponse();

      await saudeController.createSaude(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Usuário não autenticado",
        }),
      );
    });

    it("deve retornar 400 se pet_id não for fornecido", async () => {
      const req = mockRequest({
        castrado: true,
        userId: "user-123",
      });
      const res = mockResponse();

      await saudeController.createSaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "ID do pet é obrigatório",
        }),
      );
    });

    it("deve retornar 400 se castrado não for boolean", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        castrado: "sim",
        userId: "user-123",
      });
      const res = mockResponse();

      await saudeController.createSaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Campo 'castrado' deve ser true ou false",
        }),
      );
    });

    it("deve retornar 404 se pet não for encontrado", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        castrado: true,
        userId: "user-123",
      });
      const res = mockResponse();

      mockPrisma.pets.findFirst.mockResolvedValue(null);

      await saudeController.createSaude(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Pet não encontrado ou não pertence ao usuário",
        }),
      );
    });

    it("deve retornar 400 se já existir registro de saúde", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        castrado: true,
        userId: "user-123",
      });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockSaudeExistente = {
        id: "saude-123",
        pet_id: "pet-123",
        castrado: false,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.saude.findUnique.mockResolvedValue(mockSaudeExistente);

      await saudeController.createSaude(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registro de saúde já existe para este pet",
        }),
      );
    });
  });

  describe("getSaudeByPetId", () => {
    it("deve buscar saúde do pet com sucesso", async () => {
      const req = mockRequest({ userId: "user-123" }, { petId: "pet-123" });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockSaude = {
        id: "saude-123",
        pet_id: "pet-123",
        castrado: true,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.saude.findUnique.mockResolvedValue(mockSaude);

      await saudeController.getSaudeByPetId(req, res);

      expect(mockPrisma.saude.findUnique).toHaveBeenCalledWith({
        where: { pet_id: "pet-123" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Saúde do pet encontrada",
        }),
      );
    });

    it("deve retornar 404 se registro de saúde não existir", async () => {
      const req = mockRequest({ userId: "user-123" }, { petId: "pet-123" });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        tutor_id: "user-123",
        removido_em: null,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.saude.findUnique.mockResolvedValue(null);

      await saudeController.getSaudeByPetId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registro de saúde não encontrado",
        }),
      );
    });
  });

  describe("updateSaude", () => {
    it("deve atualizar saúde do pet com sucesso", async () => {
      const req = mockRequest({ castrado: false, userId: "user-123" }, { petId: "pet-123" });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockSaudeExistente = {
        id: "saude-123",
        pet_id: "pet-123",
        castrado: true,
      };

      const mockSaudeAtualizada = {
        id: "saude-123",
        pet_id: "pet-123",
        castrado: false,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.saude.findUnique.mockResolvedValue(mockSaudeExistente);
      mockPrisma.saude.update.mockResolvedValue(mockSaudeAtualizada);

      await saudeController.updateSaude(req, res);

      expect(mockPrisma.saude.update).toHaveBeenCalledWith({
        where: { pet_id: "pet-123" },
        data: { castrado: false },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Saúde do pet atualizada com sucesso",
        }),
      );
    });

    it("deve retornar 404 se registro não existir ao atualizar", async () => {
      const req = mockRequest({ castrado: false, userId: "user-123" }, { petId: "pet-123" });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        tutor_id: "user-123",
        removido_em: null,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.saude.findUnique.mockResolvedValue(null);

      await saudeController.updateSaude(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registro de saúde não encontrado",
        }),
      );
    });
  });

  describe("deleteSaude", () => {
    it("deve deletar saúde do pet com sucesso", async () => {
      const req = mockRequest({ userId: "user-123" }, { petId: "pet-123" });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockSaude = {
        id: "saude-123",
        pet_id: "pet-123",
        castrado: true,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.saude.findUnique.mockResolvedValue(mockSaude);
      mockPrisma.saude.delete.mockResolvedValue(mockSaude);

      await saudeController.deleteSaude(req, res);

      expect(mockPrisma.saude.delete).toHaveBeenCalledWith({
        where: { pet_id: "pet-123" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registro de saúde deletado com sucesso",
        }),
      );
    });
  });
});
