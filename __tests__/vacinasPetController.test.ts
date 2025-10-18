import { Request, Response } from "express";
import { Especie } from "../src/generated/prisma";

// Mock do Prisma antes de importar o controller
const mockPrisma = {
  vacinas_pet: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  pets: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  vacinas: {
    findFirst: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  getPrismaClient: () => mockPrisma,
}));

// Importar o controller após o mock
import vacinasPetController from "../src/controllers/vacinasPetController";

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

describe("VacinasPetController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addVacinaToPet", () => {
    it("deve adicionar vacina ao pet com sucesso", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        vacina_id: "vac-123",
        data_aplicacao: "2025-01-15T10:00:00.000Z",
        observacoes: "Primeira dose",
        userId: "user-123",
      });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        especie: Especie.CACHORRO,
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockVacina = {
        id: "vac-123",
        nome: "V10",
        especies: [Especie.CACHORRO],
        removido_em: null,
      };

      const mockVacinaPet = {
        id: "vp-123",
        pet_id: "pet-123",
        vacina_id: "vac-123",
        data_aplicacao: new Date("2025-01-15T10:00:00.000Z"),
        observacoes: "Primeira dose",
        vacina: mockVacina,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.vacinas.findFirst.mockResolvedValue(mockVacina);
      mockPrisma.vacinas_pet.findUnique.mockResolvedValue(null);
      mockPrisma.vacinas_pet.create.mockResolvedValue(mockVacinaPet);

      await vacinasPetController.addVacinaToPet(req, res);

      expect(mockPrisma.vacinas_pet.create).toHaveBeenCalledWith({
        data: {
          pet_id: "pet-123",
          vacina_id: "vac-123",
          data_aplicacao: new Date("2025-01-15T10:00:00.000Z"),
          observacoes: "Primeira dose",
        },
        include: {
          vacina: true,
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina adicionada ao pet com sucesso",
        }),
      );
    });

    it("deve retornar 401 se usuário não estiver autenticado", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        vacina_id: "vac-123",
      });
      const res = mockResponse();

      await vacinasPetController.addVacinaToPet(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Usuário não autenticado",
        }),
      );
    });

    it("deve retornar 400 se pet_id ou vacina_id não forem fornecidos", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        userId: "user-123",
      });
      const res = mockResponse();

      await vacinasPetController.addVacinaToPet(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "ID do pet e ID da vacina são obrigatórios",
        }),
      );
    });

    it("deve retornar 404 se pet não for encontrado", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        vacina_id: "vac-123",
        userId: "user-123",
      });
      const res = mockResponse();

      mockPrisma.pets.findFirst.mockResolvedValue(null);

      await vacinasPetController.addVacinaToPet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Pet não encontrado ou não pertence ao usuário",
        }),
      );
    });

    it("deve retornar 404 se vacina não for encontrada", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        vacina_id: "vac-123",
        userId: "user-123",
      });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        especie: Especie.CACHORRO,
        tutor_id: "user-123",
        removido_em: null,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.vacinas.findFirst.mockResolvedValue(null);

      await vacinasPetController.addVacinaToPet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina não encontrada",
        }),
      );
    });

    it("deve retornar 400 se vacina não for compatível com a espécie", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        vacina_id: "vac-123",
        userId: "user-123",
      });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        especie: Especie.CACHORRO,
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockVacina = {
        id: "vac-123",
        nome: "V3",
        especies: [Especie.GATO], // Vacina só para gatos
        removido_em: null,
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.vacinas.findFirst.mockResolvedValue(mockVacina);

      await vacinasPetController.addVacinaToPet(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Esta vacina não é compatível com cachorros",
        }),
      );
    });

    it("deve retornar 400 se pet já tiver a vacina registrada", async () => {
      const req = mockRequest({
        pet_id: "pet-123",
        vacina_id: "vac-123",
        userId: "user-123",
      });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        especie: Especie.CACHORRO,
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockVacina = {
        id: "vac-123",
        nome: "V10",
        especies: [Especie.CACHORRO],
        removido_em: null,
      };

      const mockVacinaPetExistente = {
        id: "vp-123",
        pet_id: "pet-123",
        vacina_id: "vac-123",
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.vacinas.findFirst.mockResolvedValue(mockVacina);
      mockPrisma.vacinas_pet.findUnique.mockResolvedValue(mockVacinaPetExistente);

      await vacinasPetController.addVacinaToPet(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Este pet já possui esta vacina registrada",
        }),
      );
    });
  });

  describe("listPetVacinas", () => {
    it("deve listar vacinas do pet com sucesso", async () => {
      const req = mockRequest({ userId: "user-123" }, { petId: "pet-123" });
      const res = mockResponse();

      const mockPet = {
        id: "pet-123",
        nome: "Rex",
        tutor_id: "user-123",
        removido_em: null,
      };

      const mockVacinas = [
        {
          id: "vp-1",
          pet_id: "pet-123",
          vacina_id: "vac-1",
          data_aplicacao: new Date(),
          vacina: { nome: "V10" },
        },
        {
          id: "vp-2",
          pet_id: "pet-123",
          vacina_id: "vac-2",
          data_aplicacao: new Date(),
          vacina: { nome: "Antirrábica" },
        },
      ];

      mockPrisma.pets.findFirst.mockResolvedValue(mockPet);
      mockPrisma.vacinas_pet.findMany.mockResolvedValue(mockVacinas);

      await vacinasPetController.listPetVacinas(req, res);

      expect(mockPrisma.vacinas_pet.findMany).toHaveBeenCalledWith({
        where: { pet_id: "pet-123" },
        include: { vacina: true },
        orderBy: { data_aplicacao: "desc" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacinas do pet listadas com sucesso",
        }),
      );
    });

    it("deve retornar 404 se pet não for encontrado", async () => {
      const req = mockRequest({ userId: "user-123" }, { petId: "pet-inexistente" });
      const res = mockResponse();

      mockPrisma.pets.findFirst.mockResolvedValue(null);

      await vacinasPetController.listPetVacinas(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Pet não encontrado ou não pertence ao usuário",
        }),
      );
    });
  });

  describe("getPetComplete", () => {
    it("deve buscar pet com informações completas", async () => {
      const req = mockRequest({ userId: "user-123" }, { petId: "pet-123" });
      const res = mockResponse();

      const mockPetCompleto = {
        id: "pet-123",
        nome: "Rex",
        especie: Especie.CACHORRO,
        tutor_id: "user-123",
        removido_em: null,
        saude: {
          id: "saude-123",
          castrado: true,
        },
        vacinas: [
          {
            id: "vp-1",
            vacina: { nome: "V10" },
          },
        ],
        imagens: [
          {
            id: "img-1",
            url: "http://example.com/image.jpg",
          },
        ],
        tutor: {
          id: "user-123",
          nome: "João Silva",
          email: "joao@example.com",
          endereco: "Rua das Flores, 123",
        },
      };

      mockPrisma.pets.findFirst.mockResolvedValue(mockPetCompleto);

      await vacinasPetController.getPetComplete(req, res);

      expect(mockPrisma.pets.findFirst).toHaveBeenCalledWith({
        where: {
          id: "pet-123",
          tutor_id: "user-123",
          removido_em: null,
        },
        include: {
          saude: true,
          vacinas: {
            include: { vacina: true },
            orderBy: { data_aplicacao: "desc" },
          },
          imagens: true,
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
              endereco: true,
            },
          },
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Informações completas do pet",
        }),
      );
    });
  });

  describe("updateVacinaPet", () => {
    it("deve atualizar vacina do pet com sucesso", async () => {
      const req = mockRequest(
        {
          data_aplicacao: "2025-02-20T14:00:00.000Z",
          observacoes: "Segunda dose",
          userId: "user-123",
        },
        { id: "vp-123" },
      );
      const res = mockResponse();

      const mockVacinaPet = {
        id: "vp-123",
        pet_id: "pet-123",
        vacina_id: "vac-123",
        pet: {
          tutor_id: "user-123",
        },
      };

      const mockVacinaAtualizada = {
        ...mockVacinaPet,
        data_aplicacao: new Date("2025-02-20T14:00:00.000Z"),
        observacoes: "Segunda dose",
        vacina: { nome: "V10" },
      };

      mockPrisma.vacinas_pet.findUnique.mockResolvedValue(mockVacinaPet);
      mockPrisma.vacinas_pet.update.mockResolvedValue(mockVacinaAtualizada);

      await vacinasPetController.updateVacinaPet(req, res);

      expect(mockPrisma.vacinas_pet.update).toHaveBeenCalledWith({
        where: { id: "vp-123" },
        data: {
          data_aplicacao: new Date("2025-02-20T14:00:00.000Z"),
          observacoes: "Segunda dose",
        },
        include: { vacina: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina do pet atualizada com sucesso",
        }),
      );
    });

    it("deve retornar 404 se registro não for encontrado", async () => {
      const req = mockRequest(
        {
          data_aplicacao: "2025-02-20T14:00:00.000Z",
          userId: "user-123",
        },
        { id: "vp-inexistente" },
      );
      const res = mockResponse();

      mockPrisma.vacinas_pet.findUnique.mockResolvedValue(null);

      await vacinasPetController.updateVacinaPet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registro de vacina não encontrado",
        }),
      );
    });

    it("deve retornar 403 se usuário não for o tutor", async () => {
      const req = mockRequest(
        {
          data_aplicacao: "2025-02-20T14:00:00.000Z",
          userId: "user-456",
        },
        { id: "vp-123" },
      );
      const res = mockResponse();

      const mockVacinaPet = {
        id: "vp-123",
        pet_id: "pet-123",
        vacina_id: "vac-123",
        pet: {
          tutor_id: "user-123", // Tutor diferente
        },
      };

      mockPrisma.vacinas_pet.findUnique.mockResolvedValue(mockVacinaPet);

      await vacinasPetController.updateVacinaPet(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Você não tem permissão para editar esta vacina",
        }),
      );
    });
  });

  describe("deleteVacinaPet", () => {
    it("deve deletar vacina do pet com sucesso", async () => {
      const req = mockRequest({ userId: "user-123" }, { id: "vp-123" });
      const res = mockResponse();

      const mockVacinaPet = {
        id: "vp-123",
        pet_id: "pet-123",
        vacina_id: "vac-123",
        pet: {
          tutor_id: "user-123",
        },
      };

      mockPrisma.vacinas_pet.findUnique.mockResolvedValue(mockVacinaPet);
      mockPrisma.vacinas_pet.delete.mockResolvedValue(mockVacinaPet);

      await vacinasPetController.deleteVacinaPet(req, res);

      expect(mockPrisma.vacinas_pet.delete).toHaveBeenCalledWith({
        where: { id: "vp-123" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina do pet deletada com sucesso",
        }),
      );
    });

    it("deve retornar 404 se registro não for encontrado ao deletar", async () => {
      const req = mockRequest({ userId: "user-123" }, { id: "vp-inexistente" });
      const res = mockResponse();

      mockPrisma.vacinas_pet.findUnique.mockResolvedValue(null);

      await vacinasPetController.deleteVacinaPet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registro de vacina não encontrado",
        }),
      );
    });

    it("deve retornar 403 se usuário não for o tutor ao deletar", async () => {
      const req = mockRequest({ userId: "user-456" }, { id: "vp-123" });
      const res = mockResponse();

      const mockVacinaPet = {
        id: "vp-123",
        pet_id: "pet-123",
        vacina_id: "vac-123",
        pet: {
          tutor_id: "user-123",
        },
      };

      mockPrisma.vacinas_pet.findUnique.mockResolvedValue(mockVacinaPet);

      await vacinasPetController.deleteVacinaPet(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Você não tem permissão para deletar esta vacina",
        }),
      );
    });
  });
});
