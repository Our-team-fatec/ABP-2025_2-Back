import { Request, Response, NextFunction } from "express";
import authMiddleware from "../src/middlewares/authMiddleware";
import jwtService from "../src/utils/jwtService";

// Mock do JWT Service
jest.mock("../src/utils/jwtService", () => ({
  verifyToken: jest.fn(),
}));

// Mock do ResponseHelper
jest.mock("../src/utils/responseHelper", () => ({
  error: jest.fn((message: string, code: number) => ({
    status: "error",
    message,
    code,
  })),
}));

describe("AuthMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      header: jest.fn(),
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("authMiddleware function", () => {
    it("deve autenticar usuário com token válido", () => {
      // Arrange
      const mockToken = "valid-token";
      const mockDecodedUser = {
        userId: "user-123",
        email: "test@example.com",
        grupo: 0,
      };

      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
      (jwtService.verifyToken as jest.Mock).mockReturnValue(mockDecodedUser);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.header).toHaveBeenCalledWith("Authorization");
      expect(jwtService.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockRequest.body).toEqual({
        userId: mockDecodedUser.userId,
        userEmail: mockDecodedUser.email,
        userGrupo: mockDecodedUser.grupo,
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("deve retornar erro 401 quando header Authorization não é fornecido", () => {
      // Arrange
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Token de autorização não fornecido",
        code: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar erro 401 quando header não começa com Bearer", () => {
      // Arrange
      (mockRequest.header as jest.Mock).mockReturnValue("Basic token123");

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Token de autorização não fornecido",
        code: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve retornar erro 403 para token inválido", () => {
      // Arrange
      const invalidToken = "invalid-token";
      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${invalidToken}`);
      (jwtService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error("Token inválido");
      });

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(jwtService.verifyToken).toHaveBeenCalledWith(invalidToken);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "error",
        message: "Token de autorização inválido",
        code: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve extrair corretamente o token do header Bearer", () => {
      // Arrange
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
      const mockDecodedUser = {
        userId: "user-123",
        email: "test@example.com",
        grupo: 0,
      };

      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${token}`);
      (jwtService.verifyToken as jest.Mock).mockReturnValue(mockDecodedUser);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(jwtService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockNext).toHaveBeenCalled();
    });

    it("deve preservar dados existentes em req.body ao adicionar dados do usuário", () => {
      // Arrange
      const existingData = { existingField: "existingValue" };
      mockRequest.body = existingData;

      const mockToken = "valid-token";
      const mockDecodedUser = {
        userId: "user-123",
        email: "test@example.com",
        grupo: 0,
      };

      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
      (jwtService.verifyToken as jest.Mock).mockReturnValue(mockDecodedUser);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.body).toEqual({
        existingField: "existingValue",
        userId: mockDecodedUser.userId,
        userEmail: mockDecodedUser.email,
        userGrupo: mockDecodedUser.grupo,
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
