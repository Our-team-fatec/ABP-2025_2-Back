import jwtService, { JwtPayload } from "../src/utils/jwtService";
import jwt from "jsonwebtoken";

// Mock do jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  TokenExpiredError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TokenExpiredError";
    }
  },
  JsonWebTokenError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = "JsonWebTokenError";
    }
  },
}));

describe("JwtService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("deve gerar token com payload válido", () => {
      // Arrange
      const payload: JwtPayload = {
        userId: "user-123",
        email: "test@example.com",
        grupo: 0,
      };
      const expectedToken = "generated-token";

      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      // Act
      const result = jwtService.generateToken(payload);

      // Assert
      expect(result).toBe(expectedToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String), // secretKey
        { expiresIn: "24h" },
      );
    });

    it("deve usar chave secreta do ambiente ou padrão", () => {
      // Arrange
      const payload: JwtPayload = {
        userId: "user-123",
        email: "test@example.com",
        grupo: 0,
      };

      (jwt.sign as jest.Mock).mockReturnValue("token");

      // Act
      jwtService.generateToken(payload);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        "SECRET_KEY", // Chave padrão atual
        { expiresIn: "24h" },
      );
    });
  });

  describe("verifyToken", () => {
    it("deve verificar token válido com sucesso", () => {
      // Arrange
      const token = "valid-token";
      const expectedPayload: JwtPayload = {
        userId: "user-123",
        email: "test@example.com",
        grupo: 0,
      };

      (jwt.verify as jest.Mock).mockReturnValue(expectedPayload);

      // Act
      const result = jwtService.verifyToken(token);

      // Assert
      expect(result).toEqual(expectedPayload);
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    it("deve lançar erro específico para token expirado", () => {
      // Arrange
      const token = "expired-token";
      const tokenExpiredError = new jwt.TokenExpiredError("Token expired", new Date());

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw tokenExpiredError;
      });

      // Act & Assert
      expect(() => jwtService.verifyToken(token)).toThrow("Token expirado");
    });

    it("deve lançar erro específico para token inválido", () => {
      // Arrange
      const token = "invalid-token";
      const jsonWebTokenError = new jwt.JsonWebTokenError("Invalid token");

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw jsonWebTokenError;
      });

      // Act & Assert
      expect(() => jwtService.verifyToken(token)).toThrow("Token inválido");
    });

    it("deve lançar erro genérico para outros tipos de erro", () => {
      // Arrange
      const token = "problematic-token";
      const genericError = new Error("Generic error");

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw genericError;
      });

      // Act & Assert
      expect(() => jwtService.verifyToken(token)).toThrow("Erro ao verificar token");
    });
  });
});
