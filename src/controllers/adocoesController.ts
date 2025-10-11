import { Request, Response } from "express";
import { getPrismaClient } from "../config/db";
import ResponseHelper from "../utils/responseHelper";

const prisma = getPrismaClient();

class AdocoesController {
  // Criar anúncio de adoção
  public async createAdocao(req: Request, res: Response): Promise<Response> {
    try {
      const { pet_id, descricao, endereco, userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Validações
      if (!pet_id || !descricao || !endereco) {
        return res
          .status(400)
          .json(ResponseHelper.error("Pet ID, descrição e endereço são obrigatórios", 400));
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
        return res.status(404).json(
          ResponseHelper.error("Pet não encontrado ou não pertence ao usuário", 404)
        );
      }

      // Verificar se o pet já tem anúncio de adoção ativo
      const existingAdocao = await prisma.adocoes.findFirst({
        where: {
          pet_id: pet_id,
          removido_em: null,
        },
      });

      if (existingAdocao) {
        return res.status(400).json(
          ResponseHelper.error("Este pet já possui um anúncio de adoção ativo", 400)
        );
      }

      const adocao = await prisma.adocoes.create({
        data: {
          doador_id: userId,
          pet_id,
          descricao,
          endereco,
        },
        include: {
          doador: {
            select: {
              id: true,
              nome: true,
              email: true,
              endereco: true,
            },
          },
          pet: {
            include: {
              imagens: {
                where: {
                  removido_em: null,
                },
              },
            },
          },
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json(ResponseHelper.success("Anúncio de adoção criado com sucesso", adocao));
    } catch (error) {
      console.error("Erro ao criar anúncio de adoção:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor"));
    }
  }

  // Listar todas as adoções (com filtros opcionais)
  public async listAdocoes(req: Request, res: Response): Promise<Response> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        especie, 
        raca, 
        cidade,
        doador_id 
      } = req.query;

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const skip = (pageNumber - 1) * limitNumber;

      // Construir filtros dinâmicos
      const whereConditions: any = {
        removido_em: null,
        tutor_id: null, // Apenas adoções ainda disponíveis
      };

      if (cidade) {
        whereConditions.endereco = {
          contains: cidade as string,
          mode: 'insensitive',
        };
      }

      if (doador_id) {
        whereConditions.doador_id = doador_id as string;
      }

      const [adocoes, total] = await Promise.all([
        prisma.adocoes.findMany({
          where: whereConditions,
          include: {
            doador: {
              select: {
                id: true,
                nome: true,
                email: true,
                endereco: true,
              },
            },
            pet: {
              include: {
                imagens: {
                  where: {
                    removido_em: null,
                  },
                },
              },
            },
            tutor: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          orderBy: {
            criado_em: 'desc',
          },
          skip,
          take: limitNumber,
        }),
        prisma.adocoes.count({
          where: whereConditions,
        }),
      ]);

      const totalPages = Math.ceil(total / limitNumber);

      return res.status(200).json(
        ResponseHelper.success("Adoções listadas com sucesso", {
          adocoes,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalItems: total,
            itemsPerPage: limitNumber,
          },
        })
      );
    } catch (error) {
      console.error("Erro ao listar adoções:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor"));
    }
  }

  // Buscar adoção por ID
  public async getAdocaoById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const adocao = await prisma.adocoes.findFirst({
        where: {
          id,
          removido_em: null,
        },
        include: {
          doador: {
            select: {
              id: true,
              nome: true,
              email: true,
              endereco: true,
            },
          },
          pet: {
            include: {
              imagens: {
                where: {
                  removido_em: null,
                },
              },
            },
          },
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          formularios: {
            where: {
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
            },
          },
        },
      });

      if (!adocao) {
        return res.status(404).json(ResponseHelper.error("Anúncio de adoção não encontrado", 404));
      }

      return res.status(200).json(ResponseHelper.success("Adoção encontrada", adocao));
    } catch (error) {
      console.error("Erro ao buscar adoção:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor"));
    }
  }

  // Atualizar anúncio de adoção
  public async updateAdocao(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { descricao, endereco, userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Verificar se a adoção existe e pertence ao usuário
      const adocao = await prisma.adocoes.findFirst({
        where: {
          id,
          doador_id: userId,
          removido_em: null,
        },
      });

      if (!adocao) {
        return res.status(404).json(
          ResponseHelper.error("Anúncio de adoção não encontrado ou não pertence ao usuário", 404)
        );
      }

      // Verificar se o pet já foi adotado
      if (adocao.tutor_id) {
        return res.status(400).json(
          ResponseHelper.error("Não é possível editar anúncio de pet já adotado", 400)
        );
      }

      const updatedAdocao = await prisma.adocoes.update({
        where: { id },
        data: {
          ...(descricao && { descricao }),
          ...(endereco && { endereco }),
          atualizado_em: new Date(),
        },
        include: {
          doador: {
            select: {
              id: true,
              nome: true,
              email: true,
              endereco: true,
            },
          },
          pet: {
            include: {
              imagens: {
                where: {
                  removido_em: null,
                },
              },
            },
          },
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      return res.status(200).json(
        ResponseHelper.success("Anúncio de adoção atualizado com sucesso", updatedAdocao)
      );
    } catch (error) {
      console.error("Erro ao atualizar adoção:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor"));
    }
  }

  // Marcar pet como adotado
  public async markAsAdoptado(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { tutor_id, userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      if (!tutor_id) {
        return res.status(400).json(ResponseHelper.error("ID do tutor é obrigatório", 400));
      }

      // Verificar se a adoção existe e pertence ao usuário
      const adocao = await prisma.adocoes.findFirst({
        where: {
          id,
          doador_id: userId,
          removido_em: null,
        },
      });

      if (!adocao) {
        return res.status(404).json(
          ResponseHelper.error("Anúncio de adoção não encontrado ou não pertence ao usuário", 404)
        );
      }

      // Verificar se o pet já foi adotado
      if (adocao.tutor_id) {
        return res.status(400).json(
          ResponseHelper.error("Este pet já foi adotado", 400)
        );
      }

      // Verificar se o tutor existe
      const tutor = await prisma.usuarios.findFirst({
        where: {
          id: tutor_id,
          removido_em: null,
        },
      });

      if (!tutor) {
        return res.status(404).json(ResponseHelper.error("Tutor não encontrado", 404));
      }

      const updatedAdocao = await prisma.adocoes.update({
        where: { id },
        data: {
          tutor_id,
          atualizado_em: new Date(),
        },
        include: {
          doador: {
            select: {
              id: true,
              nome: true,
              email: true,
              endereco: true,
            },
          },
          pet: {
            include: {
              imagens: {
                where: {
                  removido_em: null,
                },
              },
            },
          },
          tutor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      return res.status(200).json(
        ResponseHelper.success("Pet marcado como adotado com sucesso", updatedAdocao)
      );
    } catch (error) {
      console.error("Erro ao marcar pet como adotado:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor"));
    }
  }

  // Remover anúncio de adoção (soft delete)
  public async deleteAdocao(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      // Verificar se a adoção existe e pertence ao usuário
      const adocao = await prisma.adocoes.findFirst({
        where: {
          id,
          doador_id: userId,
          removido_em: null,
        },
      });

      if (!adocao) {
        return res.status(404).json(
          ResponseHelper.error("Anúncio de adoção não encontrado ou não pertence ao usuário", 404)
        );
      }

      await prisma.adocoes.update({
        where: { id },
        data: {
          removido_em: new Date(),
        },
      });

      return res.status(200).json(
        ResponseHelper.success("Anúncio de adoção removido com sucesso")
      );
    } catch (error) {
      console.error("Erro ao remover adoção:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor"));
    }
  }

  // Listar adoções do usuário autenticado
  public async getMyAdocoes(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.body;
      const { page = 1, limit = 10, status } = req.query;

      if (!userId) {
        return res.status(401).json(ResponseHelper.error("Usuário não autenticado", 401));
      }

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const skip = (pageNumber - 1) * limitNumber;

      const whereConditions: any = {
        doador_id: userId,
        removido_em: null,
      };

      // Filtrar por status
      if (status === 'disponivel') {
        whereConditions.tutor_id = null;
      } else if (status === 'adotado') {
        whereConditions.tutor_id = { not: null };
      }

      const [adocoes, total] = await Promise.all([
        prisma.adocoes.findMany({
          where: whereConditions,
          include: {
            pet: {
              include: {
                imagens: {
                  where: {
                    removido_em: null,
                  },
                },
              },
            },
            tutor: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
            formularios: {
              where: {
                removido_em: null,
              },
              select: {
                id: true,
                tutor_nome: true,
                tutor_email: true,
                criado_em: true,
              },
            },
          },
          orderBy: {
            criado_em: 'desc',
          },
          skip,
          take: limitNumber,
        }),
        prisma.adocoes.count({
          where: whereConditions,
        }),
      ]);

      const totalPages = Math.ceil(total / limitNumber);

      return res.status(200).json(
        ResponseHelper.success("Suas adoções listadas com sucesso", {
          adocoes,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalItems: total,
            itemsPerPage: limitNumber,
          },
        })
      );
    } catch (error) {
      console.error("Erro ao buscar adoções do usuário:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor"));
    }
  }
}

export default new AdocoesController();