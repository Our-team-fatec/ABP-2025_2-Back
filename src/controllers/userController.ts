import { Request, Response } from "express";
import { getPrismaClient } from "../config/db";
import emailValidator from "../utils/emailValidator";
import criptografia from "../utils/criptografia";
import ResponseHelper from "../utils/responseHelper";

const prisma = getPrismaClient();

class UserController {
  public async registerUser(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, endereco, senha, grupo = 0 } = req.body;

      // Validação básica dos campos obrigatórios
      if (!name || !email || !endereco || !senha) {
        return res.status(400).json(
          ResponseHelper.error("Todos os campos são obrigatórios", 400)
        );
      }

      // Validação de formato de email básico
      if (!emailValidator.validar(email.toString())) {
        return res.status(400).json(
          ResponseHelper.error("Formato de email inválido", 400)
        );
      }

      // Validação de senha (mínimo 6 caracteres)
      if (!senha || typeof senha !== "string" || senha.length < 6) {
        return res.status(400).json(
          ResponseHelper.error("A senha deve ter pelo menos 6 caracteres", 400)
        );
      }

      // Verificar se o email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json(
          ResponseHelper.error("Email já cadastrado", 409)
        );
      }

      // Hash da senha
      const hashedPassword = await criptografia.criptografarSenha(senha);

      // Criar o usuário
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          endereco,
          senha: hashedPassword,
          grupo: Number(grupo) || 0,
        },
        select: {
          id: true,
          name: true,
          email: true,
          endereco: true,
          grupo: true,
          criadoEm: true,
        },
      });

      return res.status(201).json(
        ResponseHelper.success("Usuário cadastrado com sucesso", newUser)
      );
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);

      // Tratar erros específicos do Prisma
      if (error instanceof Error && error.message.includes("Unique constraint failed")) {
        return res.status(409).json(
          ResponseHelper.error("Email já cadastrado", 409)
        );
      }

      return res.status(500).json(
        ResponseHelper.error("Erro interno do servidor", 500)
      );
    }
  }
}

export default new UserController();