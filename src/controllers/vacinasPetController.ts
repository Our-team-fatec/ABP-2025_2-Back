import { Request, Response } from "express";
import { getPrismaClient } from "../config/db";
import ResponseHelper from "../utils/responseHelper";

const prisma = getPrismaClient();

class VacinasPetController {
  // Adicionar vacina a um pet
  public async addVacinaToPet(req: Request, res: Response): Promise<Response> {
    try {
      const { pet_id, vacina_id, data_aplicacao, observacoes } = req.body;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Validações
      if (!pet_id || !vacina_id) {
        return res
          .status(400)
          .json(ResponseHelper.error("ID do pet e ID da vacina são obrigatórios", 400));
      }

      // Verificar se o pet existe e pertence ao usuário
      const pet = await prisma.pets.findFirst({
        where: {
          id: pet_id,
          tutor_id: userId,
          removido_em: null,
        },
      });

      if (!pet) {
        return res
          .status(404)
          .json(ResponseHelper.error("Pet não encontrado ou não pertence ao usuário", 404));
      }

      // Verificar se a vacina existe
      const vacina = await prisma.vacinas.findFirst({
        where: {
          id: vacina_id,
          removido_em: null,
        },
      });

      if (!vacina) {
        return res.status(404).json(ResponseHelper.error("Vacina não encontrada", 404));
      }

      // Verificar se a vacina é compatível com a espécie do pet
      if (!vacina.especies.includes(pet.especie)) {
        return res
          .status(400)
          .json(
            ResponseHelper.error(
              `Esta vacina não é compatível com ${pet.especie === "CACHORRO" ? "cachorros" : "gatos"}`,
              400,
            ),
          );
      }

      // Verificar se o pet já tem esta vacina
      const vacinaPetExistente = await prisma.vacinas_pet.findUnique({
        where: {
          pet_id_vacina_id: {
            pet_id,
            vacina_id,
          },
        },
      });

      if (vacinaPetExistente) {
        return res
          .status(400)
          .json(ResponseHelper.error("Este pet já possui esta vacina registrada", 400));
      }

      // Criar registro de vacina do pet
      const vacinaPet = await prisma.vacinas_pet.create({
        data: {
          pet_id,
          vacina_id,
          data_aplicacao: data_aplicacao ? new Date(data_aplicacao) : new Date(),
          observacoes: observacoes || null,
        },
        include: {
          vacina: true,
        },
      });

      return res
        .status(201)
        .json(ResponseHelper.success("Vacina adicionada ao pet com sucesso", { vacinaPet }));
    } catch (error) {
      console.error("Erro ao adicionar vacina ao pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao adicionar vacina ao pet", 500));
    }
  }

  // Listar vacinas de um pet
  public async listPetVacinas(req: Request, res: Response): Promise<Response> {
    try {
      const { petId } = req.params;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Verificar se o pet existe e pertence ao usuário
      const pet = await prisma.pets.findFirst({
        where: {
          id: petId,
          tutor_id: userId,
          removido_em: null,
        },
      });

      if (!pet) {
        return res
          .status(404)
          .json(ResponseHelper.error("Pet não encontrado ou não pertence ao usuário", 404));
      }

      // Buscar vacinas do pet
      const vacinas = await prisma.vacinas_pet.findMany({
        where: { pet_id: petId },
        include: {
          vacina: true,
        },
        orderBy: { data_aplicacao: "desc" },
      });

      return res
        .status(200)
        .json(ResponseHelper.success("Vacinas do pet listadas com sucesso", { vacinas }));
    } catch (error) {
      console.error("Erro ao listar vacinas do pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao listar vacinas do pet", 500));
    }
  }

  // Buscar pet com todas as informações (saúde + vacinas)
  public async getPetComplete(req: Request, res: Response): Promise<Response> {
    try {
      const { petId } = req.params;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Buscar pet com todas as informações
      const pet = await prisma.pets.findFirst({
        where: {
          id: petId,
          tutor_id: userId,
          removido_em: null,
        },
        include: {
          saude: true,
          vacinas: {
            include: {
              vacina: true,
            },
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

      if (!pet) {
        return res
          .status(404)
          .json(ResponseHelper.error("Pet não encontrado ou não pertence ao usuário", 404));
      }

      return res.status(200).json(ResponseHelper.success("Informações completas do pet", { pet }));
    } catch (error) {
      console.error("Erro ao buscar informações do pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao buscar informações do pet", 500));
    }
  }

  // Atualizar vacina do pet
  public async updateVacinaPet(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { data_aplicacao, observacoes } = req.body;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Buscar vacina do pet
      const vacinaPet = await prisma.vacinas_pet.findUnique({
        where: { id },
        include: {
          pet: true,
        },
      });

      if (!vacinaPet) {
        return res.status(404).json(ResponseHelper.error("Registro de vacina não encontrado", 404));
      }

      // Verificar se o pet pertence ao usuário
      if (vacinaPet.pet.tutor_id !== userId) {
        return res
          .status(403)
          .json(ResponseHelper.error("Você não tem permissão para editar esta vacina", 403));
      }

      // Atualizar
      const dataToUpdate: {
        data_aplicacao?: Date;
        observacoes?: string | null;
      } = {};
      if (data_aplicacao) dataToUpdate.data_aplicacao = new Date(data_aplicacao);
      if (observacoes !== undefined) dataToUpdate.observacoes = observacoes;

      const vacinaAtualizada = await prisma.vacinas_pet.update({
        where: { id },
        data: dataToUpdate,
        include: {
          vacina: true,
        },
      });

      return res.status(200).json(
        ResponseHelper.success("Vacina do pet atualizada com sucesso", {
          vacinaPet: vacinaAtualizada,
        }),
      );
    } catch (error) {
      console.error("Erro ao atualizar vacina do pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao atualizar vacina do pet", 500));
    }
  }

  // Deletar vacina do pet
  public async deleteVacinaPet(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Buscar vacina do pet
      const vacinaPet = await prisma.vacinas_pet.findUnique({
        where: { id },
        include: {
          pet: true,
        },
      });

      if (!vacinaPet) {
        return res.status(404).json(ResponseHelper.error("Registro de vacina não encontrado", 404));
      }

      // Verificar se o pet pertence ao usuário
      if (vacinaPet.pet.tutor_id !== userId) {
        return res
          .status(403)
          .json(ResponseHelper.error("Você não tem permissão para deletar esta vacina", 403));
      }

      // Deletar
      await prisma.vacinas_pet.delete({
        where: { id },
      });

      return res.status(200).json(ResponseHelper.success("Vacina do pet deletada com sucesso"));
    } catch (error) {
      console.error("Erro ao deletar vacina do pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao deletar vacina do pet", 500));
    }
  }
}

export default new VacinasPetController();
