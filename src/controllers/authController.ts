import { Request, Response } from "express";
import { getPrismaClient } from "../config/db";
import emailValidator from "../utils/emailValidator";
import criptografia from "../utils/criptografia";
import ResponseHelper from "../utils/responseHelper";
import jwtService from "../utils/jwtService";

const prisma = getPrismaClient();

class AuthController {
  public async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json(ResponseHelper.error("Email e senha são obrigatórios", 400));
      }
      if (!emailValidator.validar(email.toString())) {
        return res.status(400).json(ResponseHelper.error("Formato de email inválido", 400));
      }

      const usuario = await prisma.usuarios.findUnique({
        where: { email },
        select: {
          id: true,
          nome: true,
          email: true,
          endereco: true,
          senha: true,
          criado_em: true,
        },
      });
      if (!usuario) {
        return res.status(401).json(ResponseHelper.error("Credenciais inválidas", 401));
      }
      const senhaValida = await criptografia.verificarSenha(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json(ResponseHelper.error("Credenciais inválidas", 401));
      }

      // Gerar tokens JWT
      const accessToken = jwtService.generateToken({
        userId: usuario.id,
        email: usuario.email,
      });
      const refreshToken = jwtService.generateToken({
        userId: usuario.id,
        email: usuario.email,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha: _, ...usuarioWithoutPassword } = usuario;

      return res.status(200).json(
        ResponseHelper.success("Login realizado com sucesso", {
          usuario: usuarioWithoutPassword,
          accessToken,
          refreshToken,
        }),
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }

  public async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json(ResponseHelper.error("Refresh token não fornecido", 400));
      }
      let payload;
      try {
        payload = jwtService.verifyToken(refreshToken);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return res
          .status(401)
          .json(ResponseHelper.error("Refresh token inválido ou expirado", 401));
      }
      // Gerar novo access token
      const accessToken = jwtService.generateToken({
        userId: payload.userId,
        email: payload.email,
      });
      return res
        .status(200)
        .json(ResponseHelper.success("Token renovado com sucesso", { accessToken }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
    }
  }
}

export default new AuthController();
