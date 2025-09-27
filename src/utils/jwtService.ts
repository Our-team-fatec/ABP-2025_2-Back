import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  grupo: number;
}

class JwtService {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.JWT_SECRET || "SECRET_KEY";
  }

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.secretKey, { expiresIn: "24h" });
  }

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secretKey) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token expirado");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Token inválido");
      } else {
        throw new Error("Erro ao verificar token");
      }
    }
  }
}

export default new JwtService();
