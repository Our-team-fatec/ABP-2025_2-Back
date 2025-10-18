import { Request, Response } from "express";
import { getPrismaClient } from "../config/db";
import ResponseHelper from "../utils/responseHelper";

const prisma = getPrismaClient();

class SaudeController {
  // Criar registro de saúde para um pet
  public async createSaude(req: Request, res: Response): Promise<Response> {
    try {
      const { pet_id, castrado } = req.body;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Validações
      if (!pet_id) {
        return res.status(400).json(ResponseHelper.error("ID do pet é obrigatório", 400));
      }

      if (typeof castrado !== "boolean") {
        return res
          .status(400)
          .json(ResponseHelper.error("Campo 'castrado' deve ser true ou false", 400));
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

      // Verificar se já existe registro de saúde para este pet
      const saudeExistente = await prisma.saude.findUnique({
        where: { pet_id },
      });

      if (saudeExistente) {
        return res
          .status(400)
          .json(ResponseHelper.error("Registro de saúde já existe para este pet", 400));
      }

      // Criar registro de saúde
      const saude = await prisma.saude.create({
        data: {
          pet_id,
          castrado,
        },
      });

      return res
        .status(201)
        .json(ResponseHelper.success("Registro de saúde criado com sucesso", { saude }));
    } catch (error) {
      console.error("Erro ao criar registro de saúde:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao criar registro de saúde", 500));
    }
  }

  // Buscar saúde de um pet
  public async getSaudeByPetId(req: Request, res: Response): Promise<Response> {
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

      // Buscar saúde do pet
      const saude = await prisma.saude.findUnique({
        where: { pet_id: petId },
      });

      if (!saude) {
        return res.status(404).json(ResponseHelper.error("Registro de saúde não encontrado", 404));
      }

      return res.status(200).json(ResponseHelper.success("Saúde do pet encontrada", { saude }));
    } catch (error) {
      console.error("Erro ao buscar saúde do pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao buscar saúde do pet", 500));
    }
  }

  // Atualizar saúde de um pet
  public async updateSaude(req: Request, res: Response): Promise<Response> {
    try {
      const { petId } = req.params;
      const { castrado } = req.body;
      const userId = req.body.userId;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Validações
      if (typeof castrado !== "boolean") {
        return res
          .status(400)
          .json(ResponseHelper.error("Campo 'castrado' deve ser true ou false", 400));
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

      // Verificar se existe registro de saúde
      const saudeExistente = await prisma.saude.findUnique({
        where: { pet_id: petId },
      });

      if (!saudeExistente) {
        return res.status(404).json(ResponseHelper.error("Registro de saúde não encontrado", 404));
      }

      // Atualizar saúde
      const saude = await prisma.saude.update({
        where: { pet_id: petId },
        data: { castrado },
      });

      return res
        .status(200)
        .json(ResponseHelper.success("Saúde do pet atualizada com sucesso", { saude }));
    } catch (error) {
      console.error("Erro ao atualizar saúde do pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao atualizar saúde do pet", 500));
    }
  }

  // Deletar registro de saúde
  public async deleteSaude(req: Request, res: Response): Promise<Response> {
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

      // Verificar se existe registro de saúde
      const saudeExistente = await prisma.saude.findUnique({
        where: { pet_id: petId },
      });

      if (!saudeExistente) {
        return res.status(404).json(ResponseHelper.error("Registro de saúde não encontrado", 404));
      }

      // Deletar saúde
      await prisma.saude.delete({
        where: { pet_id: petId },
      });

      return res.status(200).json(ResponseHelper.success("Registro de saúde deletado com sucesso"));
    } catch (error) {
      console.error("Erro ao deletar saúde do pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao deletar saúde do pet", 500));
    }
  }
}

export default new SaudeController();
