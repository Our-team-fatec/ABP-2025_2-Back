import { Request, Response, NextFunction } from "express";
import ApiException from "../exceptions/apiException";
import ResponseHelper from "../utils/responseHelper";

export const errorMiddleware = (
  error: ApiException | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  if (error instanceof ApiException) {
    return res.status(error.statusCode).json(ResponseHelper.error(error.message, error.statusCode));
  }

  // Erro não tratado
  console.error("Erro não tratado:", error);
  return res.status(500).json(ResponseHelper.error("Erro interno do servidor", 500));
};
