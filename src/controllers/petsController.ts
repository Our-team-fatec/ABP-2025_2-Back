import { Request, Response } from "express";
import { getPrismaClient } from "../config/db";
import ResponseHelper from "../utils/responseHelper";
import { Especie } from "../generated/prisma";
import { processImagesAsync } from "../utils/asyncImageUpload";

const prisma = getPrismaClient();

class PetsController {
  // Criar pet
  public async createPet(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, especie, raca, porte, genero, cor, userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Validações
      if (!nome || !especie || !raca || !porte || !genero || !cor) {
        return res
          .status(400)
          .json(
            ResponseHelper.error("Nome, espécie, raça, porte, gênero e cor são obrigatórios", 400),
          );
      }

      if (!Object.values(Especie).includes(especie)) {
        return res.status(400).json(ResponseHelper.error("Espécie deve ser CACHORRO ou GATO", 400));
      }

      // Verificar se o usuário existe
      const user = await prisma.usuarios.findFirst({
        where: {
          id: userId,
          removido_em: null,
        },
      });

      if (!user) {
        return res.status(404).json(ResponseHelper.error("Usuário não encontrado", 404));
      }

      const pet = await prisma.pets.create({
        data: {
          nome,
          especie,
          raca,
          porte,
          genero,
          cor,
          tutor_id: userId,
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

      // 🚀 UPLOAD ASSÍNCRONO: Processa imagens em background
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Inicia processamento assíncrono (não bloqueia resposta)
        processImagesAsync(req.files, pet.id).catch((error) => {
          console.error("Erro no processamento assíncrono de imagens:", error);
        });

        // Retorna resposta imediata informando que imagens estão sendo processadas
        return res.status(201).json({
          ...ResponseHelper.success("Pet criado com sucesso", pet),
          message: "Pet criado! Imagens estão sendo processadas em segundo plano.",
          imagesProcessing: true,
          imageCount: req.files.length,
        });
      }

      return res.status(201).json(ResponseHelper.success("Pet criado com sucesso", pet));
    } catch (error) {
      console.error("Erro ao criar pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }

  // Listar pets do usuário autenticado
  public async getUserPets(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.body;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      const skip = (Number(page) - 1) * Number(limit);

      const pets = await prisma.pets.findMany({
        where: {
          tutor_id: userId,
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
        skip,
        take: Number(limit),
        orderBy: {
          criado_em: "desc",
        },
      });

      const total = await prisma.pets.count({
        where: {
          tutor_id: userId,
          removido_em: null,
        },
      });

      const response = {
        pets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      };

      return res.json(ResponseHelper.success("Pets encontrados", response));
    } catch (error) {
      console.error("Erro ao buscar pets:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }

  // Buscar pet por ID (apenas do próprio usuário)
  public async getPetById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      const pet = await prisma.pets.findFirst({
        where: {
          id,
          tutor_id: userId,
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

      if (!pet) {
        return res.status(404).json(ResponseHelper.error("Pet não encontrado", 404));
      }

      return res.json(ResponseHelper.success("Pet encontrado", pet));
    } catch (error) {
      console.error("Erro ao buscar pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }

  // Atualizar pet
  public async updatePet(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { nome, especie, raca, porte, genero, cor, userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Verificar se o pet existe e pertence ao usuário
      const existingPet = await prisma.pets.findFirst({
        where: {
          id,
          tutor_id: userId,
          removido_em: null,
        },
      });

      if (!existingPet) {
        return res.status(404).json(ResponseHelper.error("Pet não encontrado", 404));
      }

      // Validações
      if (especie && !Object.values(Especie).includes(especie)) {
        return res.status(400).json(ResponseHelper.error("Espécie deve ser CACHORRO ou GATO", 400));
      }

      const updatedPet = await prisma.pets.update({
        where: { id },
        data: {
          ...(nome && { nome }),
          ...(especie && { especie }),
          ...(raca && { raca }),
          ...(porte && { porte }),
          ...(genero && { genero }),
          ...(cor && { cor }),
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

      // 🚀 UPLOAD ASSÍNCRONO: Processa novas imagens em background
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Inicia processamento assíncrono (não bloqueia resposta)
        processImagesAsync(req.files, id).catch((error) => {
          console.error("Erro no processamento assíncrono de imagens:", error);
        });

        // Retorna resposta imediata informando que imagens estão sendo processadas
        return res.json({
          ...ResponseHelper.success("Pet atualizado com sucesso", updatedPet),
          message: "Pet atualizado! Novas imagens estão sendo processadas em segundo plano.",
          imagesProcessing: true,
          imageCount: req.files.length,
        });
      }

      return res.json(ResponseHelper.success("Pet atualizado com sucesso", updatedPet));
    } catch (error) {
      console.error("Erro ao atualizar pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }

  // Verificar status das imagens de um pet
  public async getPetImageStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Verificar se o pet existe e pertence ao usuário
      const pet = await prisma.pets.findFirst({
        where: {
          id,
          tutor_id: userId,
          removido_em: null,
        },
        include: {
          imagens: {
            where: { removido_em: null },
          },
        },
      });

      if (!pet) {
        return res.status(404).json(ResponseHelper.error("Pet não encontrado", 404));
      }

      return res.json(
        ResponseHelper.success("Status das imagens", {
          petId: pet.id,
          petName: pet.nome,
          totalImages: pet.imagens.length,
          images: pet.imagens,
        }),
      );
    } catch (error) {
      console.error("Erro ao buscar status das imagens:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }

  // Deletar pet (soft delete)
  public async deletePet(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Verificar se o pet existe e pertence ao usuário
      const existingPet = await prisma.pets.findFirst({
        where: {
          id,
          tutor_id: userId,
          removido_em: null,
        },
      });

      if (!existingPet) {
        return res.status(404).json(ResponseHelper.error("Pet não encontrado", 404));
      }

      // Soft delete
      await prisma.pets.update({
        where: { id },
        data: {
          removido_em: new Date(),
        },
      });

      return res.json(ResponseHelper.success("Pet removido com sucesso", null));
    } catch (error) {
      console.error("Erro ao deletar pet:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }

  // Listar todos os pets (público - para adoção)
  public async getAllPets(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, especie, raca } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        removido_em: null,
        adocao: {
          removido_em: null,
          tutor_id: null, // Apenas pets disponíveis para adoção
        },
      };

      if (especie) {
        where.especie = especie;
      }

      if (raca) {
        where.raca = {
          contains: raca as string,
          mode: "insensitive",
        };
      }

      const pets = await prisma.pets.findMany({
        where,
        include: {
          tutor: {
            select: {
              id: true,
              nome: true,
              endereco: true,
            },
          },
          imagens: {
            where: { removido_em: null },
          },
          adocao: {
            select: {
              id: true,
              descricao: true,
              endereco: true,
              criado_em: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          criado_em: "desc",
        },
      });

      const total = await prisma.pets.count({ where });

      const response = {
        pets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      };

      return res.json(ResponseHelper.success("Pets encontrados", response));
    } catch (error) {
      console.error("Erro ao buscar pets:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }

  // Deletar imagem específica de um pet
  public async deleteImage(req: Request, res: Response): Promise<Response> {
    try {
      const { petId, imageId } = req.params;
      const { userId } = req.body;

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
        return res.status(404).json(ResponseHelper.error("Pet não encontrado", 404));
      }

      // Verificar se a imagem existe e pertence ao pet
      const image = await prisma.imagens.findFirst({
        where: {
          id: imageId,
          pet_id: petId,
          removido_em: null,
        },
      });

      if (!image) {
        return res.status(404).json(ResponseHelper.error("Imagem não encontrada", 404));
      }

      // Soft delete da imagem
      await prisma.imagens.update({
        where: { id: imageId },
        data: {
          removido_em: new Date(),
        },
      });

      return res.json(ResponseHelper.success("Imagem removida com sucesso", null));
    } catch (error) {
      console.error("Erro ao deletar imagem:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }
}

export default new PetsController();
