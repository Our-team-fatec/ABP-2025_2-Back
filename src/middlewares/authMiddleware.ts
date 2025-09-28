import { Request, Response, NextFunction } from "express";
import ResponseHelper from "../utils/responseHelper";
import jwtService from "../utils/jwtService";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(ResponseHelper.error("Token de autorização não fornecido", 401));
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwtService.verifyToken(token);
    req.body = {
      ...req.body,
      userId: decoded.userId,
      userEmail: decoded.email
    };
    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return res.status(403).json(ResponseHelper.error("Token de autorização inválido", 403));
  }
};

export default authMiddleware;
