import { Request, Response } from "express";
import { getPrismaClient } from "../config/db";
import ResponseHelper from "../utils/responseHelper";
import { Especie } from "../generated/prisma";

const prisma = getPrismaClient();

class VacinasController {
  // Listar todas as vacinas
  public async listVacinas(req: Request, res: Response): Promise<Response> {
    try {
      const { especie } = req.query;

      const whereClause: any = {
        removido_em: null,
      };

      // Filtrar por espécie se fornecido
      if (especie) {
        if (!Object.values(Especie).includes(especie as Especie)) {
          return res
            .status(400)
            .json(ResponseHelper.error("Espécie deve ser CACHORRO ou GATO", 400));
        }
        whereClause.especies = { has: especie };
      }

      const vacinas = await prisma.vacinas.findMany({
        where: whereClause,
        orderBy: { nome: "asc" },
      });

      return res
        .status(200)
        .json(ResponseHelper.success("Vacinas listadas com sucesso", { vacinas }));
    } catch (error) {
      console.error("Erro ao listar vacinas:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao listar vacinas", 500));
    }
  }

  // Buscar vacina por ID
  public async getVacinaById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const vacina = await prisma.vacinas.findFirst({
        where: {
          id,
          removido_em: null,
        },
      });

      if (!vacina) {
        return res.status(404).json(ResponseHelper.error("Vacina não encontrada", 404));
      }

      return res.status(200).json(ResponseHelper.success("Vacina encontrada", { vacina }));
    } catch (error) {
      console.error("Erro ao buscar vacina:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao buscar vacina", 500));
    }
  }

  // Criar nova vacina
  public async createVacina(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, descricao, especies } = req.body;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Validações
      if (!nome) {
        return res.status(400).json(ResponseHelper.error("Nome da vacina é obrigatório", 400));
      }

      if (!especies || !Array.isArray(especies) || especies.length === 0) {
        return res
          .status(400)
          .json(
            ResponseHelper.error("Espécies é obrigatório e deve ser um array não vazio", 400),
          );
      }

      // Validar espécies
      const especiesValidas = especies.every((esp) => Object.values(Especie).includes(esp));
      if (!especiesValidas) {
        return res
          .status(400)
          .json(ResponseHelper.error("Espécies devem ser CACHORRO ou GATO", 400));
      }

      // Verificar se já existe vacina com este nome
      const vacinaExistente = await prisma.vacinas.findUnique({
        where: { nome },
      });

      if (vacinaExistente && !vacinaExistente.removido_em) {
        return res.status(400).json(ResponseHelper.error("Já existe uma vacina com este nome", 400));
      }

      // Criar vacina
      const vacina = await prisma.vacinas.create({
        data: {
          nome,
          descricao: descricao || null,
          especies,
        },
      });

      return res
        .status(201)
        .json(ResponseHelper.success("Vacina criada com sucesso", { vacina }));
    } catch (error) {
      console.error("Erro ao criar vacina:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao criar vacina", 500));
    }
  }

  // Atualizar vacina
  public async updateVacina(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { nome, descricao, especies } = req.body;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Verificar se a vacina existe
      const vacinaExistente = await prisma.vacinas.findFirst({
        where: {
          id,
          removido_em: null,
        },
      });

      if (!vacinaExistente) {
        return res.status(404).json(ResponseHelper.error("Vacina não encontrada", 404));
      }

      // Validar espécies se fornecidas
      if (especies) {
        if (!Array.isArray(especies) || especies.length === 0) {
          return res
            .status(400)
            .json(ResponseHelper.error("Espécies deve ser um array não vazio", 400));
        }

        const especiesValidas = especies.every((esp) => Object.values(Especie).includes(esp));
        if (!especiesValidas) {
          return res
            .status(400)
            .json(ResponseHelper.error("Espécies devem ser CACHORRO ou GATO", 400));
        }
      }

      // Verificar se o novo nome já existe (se estiver mudando o nome)
      if (nome && nome !== vacinaExistente.nome) {
        const nomeExiste = await prisma.vacinas.findFirst({
          where: {
            nome,
            removido_em: null,
            id: { not: id },
          },
        });

        if (nomeExiste) {
          return res
            .status(400)
            .json(ResponseHelper.error("Já existe uma vacina com este nome", 400));
        }
      }

      // Atualizar vacina
      const dataToUpdate: any = {};
      if (nome) dataToUpdate.nome = nome;
      if (descricao !== undefined) dataToUpdate.descricao = descricao;
      if (especies) dataToUpdate.especies = especies;

      const vacina = await prisma.vacinas.update({
        where: { id },
        data: dataToUpdate,
      });

      return res
        .status(200)
        .json(ResponseHelper.success("Vacina atualizada com sucesso", { vacina }));
    } catch (error) {
      console.error("Erro ao atualizar vacina:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao atualizar vacina", 500));
    }
  }

  // Deletar vacina (soft delete)
  public async deleteVacina(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Verificar se a vacina existe
      const vacinaExistente = await prisma.vacinas.findFirst({
        where: {
          id,
          removido_em: null,
        },
      });

      if (!vacinaExistente) {
        return res.status(404).json(ResponseHelper.error("Vacina não encontrada", 404));
      }

      // Soft delete
      await prisma.vacinas.update({
        where: { id },
        data: { removido_em: new Date() },
      });

      return res.status(200).json(ResponseHelper.success("Vacina deletada com sucesso"));
    } catch (error) {
      console.error("Erro ao deletar vacina:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao deletar vacina", 500));
    }
  }
}

export default new VacinasController();
