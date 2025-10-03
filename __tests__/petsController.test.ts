import { Request, Response } from "express";
import { Especie } from "../src/generated/prisma";

// Mock do Prisma antes de importar o controller
const mockPrisma = {
  pets: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  usuarios: {
    findFirst: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  getPrismaClient: () => mockPrisma,
}));

// Importar o controller após o mock
import petsController from "../src/controllers/petsController";

// Mocks para Request e Response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRequest = (body: any = {}, params: any = {}, query: any = {}) =>
  ({
    body,
    params,
    query,
  }) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("PetsController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPet", () => {
    it("deve criar um pet com sucesso", async () => {
      const req = mockRequest({
        nome: "Rex",
        especie: Especie.CACHORRO,
        raca: "Golden Retriever",
        userId: "user-123",
      });
      const res = mockResponse();

      const mockUser = { id: "user-123", nome: "João", email: "joao@test.com" };
      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        especie: Especie.CACHORRO,
        raca: "Golden Retriever",
        tutor_id: "user-123",
        tutor: { id: "user-123", nome: "João", email: "joao@test.com" },
        imagens: [],
      };

      mockPrisma.usuarios.findFirst.mockResolvedValue(mockUser);
      mockPrisma.pets.create.mockResolvedValue(mockPet);

      await petsController.createPet(req, res);

      expect(mockPrisma.pets.create).toHaveBeenCalledWith({
        data: {
          nome: "Rex",
          especie: Especie.CACHORRO,
          raca: "Golden Retriever",
          tutor_id: "user-123",
        },
        include: {
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          imagens: true,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Pet criado com sucesso",
        data: mockPet,
      });
    });

    it("deve retornar erro se userId não for fornecido", async () => {
      const req = mockRequest({
        nome: "Rex",
        especie: Especie.CACHORRO,
        raca: "Golden Retriever",
      });
      const res = mockResponse();

      await petsController.createPet(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Usuário não autenticado",
        code: 401,
      });
    });

    it("deve retornar erro se campos obrigatórios não forem fornecidos", async () => {
      const req = mockRequest({
        userId: "user-123",
        nome: "Rex",
        // especie e raca ausentes
      });
      const res = mockResponse();

      await petsController.createPet(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Nome, espécie e raça são obrigatórios",
        code: 400,
      });
    });

    it("deve retornar erro se espécie for inválida", async () => {
      const req = mockRequest({
        userId: "user-123",
        nome: "Rex",
        especie: "PASSARO", // espécie inválida
        raca: "Golden Retriever",
      });
      const res = mockResponse();

      await petsController.createPet(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Espécie deve ser CACHORRO ou GATO",
        code: 400,
      });
    });
  });

  describe("getUserPets", () => {
    it("deve listar pets do usuário com sucesso", async () => {
      const req = mockRequest({ userId: "user-123" }, {}, { page: 1, limit: 10 });
      const res = mockResponse();

      const mockPets = [
        {
          id: "pet-1",
          nome: "Rex",
          especie: Especie.CACHORRO,
          raca: "Golden",
          tutor: { id: "user-123", nome: "João", email: "joao@test.com" },
          imagens: [],
          adocao: null,
        },
      ];

      mockPrisma.pets.findMany.mockResolvedValue(mockPets);
      mockPrisma.pets.count.mockResolvedValue(1);

      await petsController.getUserPets(req, res);

      expect(mockPrisma.pets.findMany).toHaveBeenCalledWith({
        where: {
          tutor_id: "user-123",
          removido_em: null,
        },
        include: {
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          imagens: {
            where: { removido_em: null },
          },
          adocao: {
            where: { removido_em: null },
          },
        },
        skip: 0,
        take: 10,
        orderBy: {
          criado_em: "desc",
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Pets encontrados",
        data: {
          pets: mockPets,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1,
          },
        },
      });
    });
  });

  describe("getPetById", () => {
    it("deve retornar pet por ID com sucesso", async () => {
      const req = mockRequest({ userId: "user-123" }, { id: "pet-123" });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        especie: Especie.CACHORRO,
        raca: "Golden",
        tutor: { id: "user-123", nome: "João", email: "joao@test.com" },
        imagens: [],
        adocao: null,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);

      await petsController.getPetById(req, res);

      expect(mockPrisma.pets.findFirst).toHaveBeenCalledWith({
        where: {
          id: "pet-123",
          tutor_id: "user-123",
          removido_em: null,
        },
        include: {
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          imagens: {
            where: { removido_em: null },
          },
          adocao: {
            where: { removido_em: null },
          },
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Pet encontrado",
        data: mockPet,
      });
    });

    it("deve retornar erro se pet não for encontrado", async () => {
      const req = mockRequest({ userId: "user-123" }, { id: "pet-inexistente" });
      const res = mockResponse();

      mockPrisma.pets.findFirst.mockResolvedValue(null);

      await petsController.getPetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: "error",
        message: "Pet não encontrado",
        code: 404,
      });
    });
  });

  describe("updatePet", () => {
    it("deve atualizar pet com sucesso", async () => {
      const req = mockRequest(
        {
          userId: "user-123",
          nome: "Rex Atualizado",
          especie: Especie.CACHORRO,
          raca: "Golden Retriever",
        },
        { id: "pet-123" },
      );
      const res = mockResponse();

      const mockExistingPet = { id: "pet-123", tutor_id: "user-123" };
      const mockUpdatedPet = {
        id: "pet-123",
        nome: "Rex Atualizado",
        especie: Especie.CACHORRO,
        raca: "Golden Retriever",
        tutor: { id: "user-123", nome: "João", email: "joao@test.com" },
        imagens: [],
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockExistingPet);
      mockPrisma.pets.update.mockResolvedValue(mockUpdatedPet);

      await petsController.updatePet(req, res);

      expect(mockPrisma.pets.update).toHaveBeenCalledWith({
        where: { id: "pet-123" },
        data: {
          nome: "Rex Atualizado",
          especie: Especie.CACHORRO,
          raca: "Golden Retriever",
        },
        include: {
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          imagens: {
            where: { removido_em: null },
          },
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Pet atualizado com sucesso",
        data: mockUpdatedPet,
      });
    });
  });

  describe("deletePet", () => {
    it("deve deletar pet com sucesso (soft delete)", async () => {
      const req = mockRequest({ userId: "user-123" }, { id: "pet-123" });
      const res = mockResponse();

      const mockExistingPet = { id: "pet-123", tutor_id: "user-123" };

      mockPrisma.pets.findFirst.mockResolvedValue(mockExistingPet);
      mockPrisma.pets.update.mockResolvedValue({});

      await petsController.deletePet(req, res);

      expect(mockPrisma.pets.update).toHaveBeenCalledWith({
        where: { id: "pet-123" },
        data: {
          removido_em: expect.any(Date),
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Pet removido com sucesso",
        data: null,
      });
    });
  });

  describe("getAllPets", () => {
    it("deve listar todos os pets públicos com sucesso", async () => {
      const req = mockRequest({}, {}, { page: 1, limit: 10 });
      const res = mockResponse();

      const mockPets = [
        {
          id: "pet-1",
          nome: "Rex",
          especie: Especie.CACHORRO,
          tutor: { id: "user-123", nome: "João", endereco: "Rua A" },
          imagens: [],
          adocao: { id: "adocao-1", descricao: "Pet para adoção" },
        },
      ];

      mockPrisma.pets.findMany.mockResolvedValue(mockPets);
      mockPrisma.pets.count.mockResolvedValue(1);

      await petsController.getAllPets(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Pets encontrados",
        data: {
          pets: mockPets,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1,
          },
        },
      });
    });
  });
});
