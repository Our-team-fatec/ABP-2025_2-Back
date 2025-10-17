import { Request, Response } from "express";
import { Especie } from "../src/generated/prisma";

// Mock do Prisma antes de importar o controller
const mockPrisma = {
  vacinas: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../src/config/db", () => ({
  getPrismaClient: () => mockPrisma,
}));

// Importar o controller após o mock
import vacinasController from "../src/controllers/vacinasController";

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

describe("VacinasController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listVacinas", () => {
    it("deve listar todas as vacinas com sucesso", async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      const mockVacinas = [
        {
          id: "vac-1",
          nome: "V10",
          descricao: "Vacina déctupla",
          especies: [Especie.CACHORRO],
          removido_em: null,
        },
        {
          id: "vac-2",
          nome: "V3",
          descricao: "Tríplice felina",
          especies: [Especie.GATO],
          removido_em: null,
        },
      ];

      mockPrisma.vacinas.findMany.mockResolvedValue(mockVacinas);

      await vacinasController.listVacinas(req, res);

      expect(mockPrisma.vacinas.findMany).toHaveBeenCalledWith({
        where: { removido_em: null },
        orderBy: { nome: "asc" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacinas listadas com sucesso",
          data: expect.objectContaining({ vacinas: mockVacinas }),
        }),
      );
    });

    it("deve filtrar vacinas por espécie CACHORRO", async () => {
      const req = mockRequest({}, {}, { especie: Especie.CACHORRO });
      const res = mockResponse();

      const mockVacinas = [
        {
          id: "vac-1",
          nome: "V10",
          descricao: "Vacina déctupla",
          especies: [Especie.CACHORRO],
          removido_em: null,
        },
      ];

      mockPrisma.vacinas.findMany.mockResolvedValue(mockVacinas);

      await vacinasController.listVacinas(req, res);

      expect(mockPrisma.vacinas.findMany).toHaveBeenCalledWith({
        where: {
          removido_em: null,
          especies: { has: Especie.CACHORRO },
        },
        orderBy: { nome: "asc" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deve filtrar vacinas por espécie GATO", async () => {
      const req = mockRequest({}, {}, { especie: Especie.GATO });
      const res = mockResponse();

      const mockVacinas = [
        {
          id: "vac-2",
          nome: "V3",
          descricao: "Tríplice felina",
          especies: [Especie.GATO],
          removido_em: null,
        },
      ];

      mockPrisma.vacinas.findMany.mockResolvedValue(mockVacinas);

      await vacinasController.listVacinas(req, res);

      expect(mockPrisma.vacinas.findMany).toHaveBeenCalledWith({
        where: {
          removido_em: null,
          especies: { has: Especie.GATO },
        },
        orderBy: { nome: "asc" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deve retornar 400 para espécie inválida", async () => {
      const req = mockRequest({}, {}, { especie: "PAPAGAIO" });
      const res = mockResponse();

      await vacinasController.listVacinas(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Espécie deve ser CACHORRO ou GATO",
        }),
      );
    });
  });

  describe("getVacinaById", () => {
    it("deve buscar vacina por ID com sucesso", async () => {
      const req = mockRequest({}, { id: "vac-1" }, {});
      const res = mockResponse();

      const mockVacina = {
        id: "vac-1",
        nome: "V10",
        descricao: "Vacina déctupla",
        especies: [Especie.CACHORRO],
        removido_em: null,
      };

      mockPrisma.vacinas.findFirst.mockResolvedValue(mockVacina);

      await vacinasController.getVacinaById(req, res);

      expect(mockPrisma.vacinas.findFirst).toHaveBeenCalledWith({
        where: { id: "vac-1", removido_em: null },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina encontrada",
        }),
      );
    });

    it("deve retornar 404 se vacina não for encontrada", async () => {
      const req = mockRequest({}, { id: "vac-inexistente" }, {});
      const res = mockResponse();

      mockPrisma.vacinas.findFirst.mockResolvedValue(null);

      await vacinasController.getVacinaById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina não encontrada",
        }),
      );
    });
  });

  describe("createVacina", () => {
    it("deve criar vacina com sucesso", async () => {
      const req = mockRequest({
        nome: "Vacina Customizada",
        descricao: "Descrição da vacina",
        especies: [Especie.CACHORRO],
        userId: "user-123",
      });
      const res = mockResponse();

      const mockVacina = {
        id: "vac-new",
        nome: "Vacina Customizada",
        descricao: "Descrição da vacina",
        especies: [Especie.CACHORRO],
        criado_em: new Date(),
        atualizado_em: new Date(),
        removido_em: null,
      };

      mockPrisma.vacinas.findUnique.mockResolvedValue(null);
      mockPrisma.vacinas.create.mockResolvedValue(mockVacina);

      await vacinasController.createVacina(req, res);

      expect(mockPrisma.vacinas.create).toHaveBeenCalledWith({
        data: {
          nome: "Vacina Customizada",
          descricao: "Descrição da vacina",
          especies: [Especie.CACHORRO],
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina criada com sucesso",
        }),
      );
    });

    it("deve retornar 401 se usuário não estiver autenticado", async () => {
      const req = mockRequest({
        nome: "Vacina",
        especies: [Especie.CACHORRO],
      });
      const res = mockResponse();

      await vacinasController.createVacina(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Usuário não autenticado",
        }),
      );
    });

    it("deve retornar 400 se nome não for fornecido", async () => {
      const req = mockRequest({
        especies: [Especie.CACHORRO],
        userId: "user-123",
      });
      const res = mockResponse();

      await vacinasController.createVacina(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Nome da vacina é obrigatório",
        }),
      );
    });

    it("deve retornar 400 se especies não for fornecido", async () => {
      const req = mockRequest({
        nome: "Vacina",
        userId: "user-123",
      });
      const res = mockResponse();

      await vacinasController.createVacina(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Espécies é obrigatório e deve ser um array não vazio",
        }),
      );
    });

    it("deve retornar 400 se especies contiver valor inválido", async () => {
      const req = mockRequest({
        nome: "Vacina",
        especies: ["PAPAGAIO"],
        userId: "user-123",
      });
      const res = mockResponse();

      await vacinasController.createVacina(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Espécies devem ser CACHORRO ou GATO",
        }),
      );
    });

    it("deve retornar 400 se já existir vacina com mesmo nome", async () => {
      const req = mockRequest({
        nome: "V10",
        especies: [Especie.CACHORRO],
        userId: "user-123",
      });
      const res = mockResponse();

      const mockVacinaExistente = {
        id: "vac-1",
        nome: "V10",
        removido_em: null,
      };

      mockPrisma.vacinas.findUnique.mockResolvedValue(mockVacinaExistente);

      await vacinasController.createVacina(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Já existe uma vacina com este nome",
        }),
      );
    });
  });

  describe("updateVacina", () => {
    it("deve atualizar vacina com sucesso", async () => {
      const req = mockRequest(
        {
          nome: "V10 Atualizada",
          descricao: "Nova descrição",
          especies: [Especie.CACHORRO, Especie.GATO],
          userId: "user-123",
        },
        { id: "vac-1" },
      );
      const res = mockResponse();

      const mockVacinaExistente = {
        id: "vac-1",
        nome: "V10",
        descricao: "Vacina antiga",
        especies: [Especie.CACHORRO],
        removido_em: null,
      };

      const mockVacinaAtualizada = {
        id: "vac-1",
        nome: "V10 Atualizada",
        descricao: "Nova descrição",
        especies: [Especie.CACHORRO, Especie.GATO],
        removido_em: null,
      };

      mockPrisma.vacinas.findFirst
        .mockResolvedValueOnce(mockVacinaExistente) // Primeira chamada: buscar vacina existente
        .mockResolvedValueOnce(null); // Segunda chamada: verificar se nome já existe
      mockPrisma.vacinas.update.mockResolvedValue(mockVacinaAtualizada);

      await vacinasController.updateVacina(req, res);

      expect(mockPrisma.vacinas.update).toHaveBeenCalledWith({
        where: { id: "vac-1" },
        data: {
          nome: "V10 Atualizada",
          descricao: "Nova descrição",
          especies: [Especie.CACHORRO, Especie.GATO],
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina atualizada com sucesso",
        }),
      );
    });

    it("deve retornar 404 se vacina não existir", async () => {
      const req = mockRequest(
        {
          nome: "Nova Vacina",
          userId: "user-123",
        },
        { id: "vac-inexistente" },
      );
      const res = mockResponse();

      mockPrisma.vacinas.findFirst.mockResolvedValue(null);

      await vacinasController.updateVacina(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina não encontrada",
        }),
      );
    });
  });

  describe("deleteVacina", () => {
    it("deve deletar vacina com sucesso (soft delete)", async () => {
      const req = mockRequest({ userId: "user-123" }, { id: "vac-1" });
      const res = mockResponse();

      const mockVacina = {
        id: "vac-1",
        nome: "V10",
        removido_em: null,
      };

      mockPrisma.vacinas.findFirst.mockResolvedValue(mockVacina);
      mockPrisma.vacinas.update.mockResolvedValue({
        ...mockVacina,
        removido_em: new Date(),
      });

      await vacinasController.deleteVacina(req, res);

      expect(mockPrisma.vacinas.update).toHaveBeenCalledWith({
        where: { id: "vac-1" },
        data: { removido_em: expect.any(Date) },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina deletada com sucesso",
        }),
      );
    });

    it("deve retornar 404 se vacina não existir ao deletar", async () => {
      const req = mockRequest({ userId: "user-123" }, { id: "vac-inexistente" });
      const res = mockResponse();

      mockPrisma.vacinas.findFirst.mockResolvedValue(null);

      await vacinasController.deleteVacina(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vacina não encontrada",
        }),
      );
    });
  });
});
