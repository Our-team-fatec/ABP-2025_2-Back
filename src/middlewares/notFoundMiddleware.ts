import { Request, Response, NextFunction } from 'express';
import ApiException from '../exceptions/apiException';

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const error = ApiException.notFound(`Rota ${req.originalUrl} não encontrada`);
    next(error);
};