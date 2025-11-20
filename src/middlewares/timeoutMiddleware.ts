import { Request, Response, NextFunction } from "express";

/**
 * Middleware de timeout para evitar que requisições lentas travem o servidor
 * @param timeout Tempo máximo em milissegundos (padrão: 15 segundos)
 */
export const timeoutMiddleware = (timeout: number = 15000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Configurar timeout na requisição
    req.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          status: "error",
          message: "Requisição expirou - tente novamente",
          code: 408,
        });
      }
    });

    // Configurar timeout na resposta
    res.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          status: "error",
          message: "Tempo de resposta excedido",
          code: 408,
        });
      }
    });

    next();
  };
};
