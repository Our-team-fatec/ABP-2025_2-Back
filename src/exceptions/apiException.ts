class ApiException extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        
        // Mantém o stack trace correto
        Error.captureStackTrace(this, this.constructor);
    }

    static notFound(message: string = "Rota não encontrada") {
        return new ApiException(message, 404);
    }

    static badRequest(message: string = "Requisição inválida") {
        return new ApiException(message, 400);
    }

    static unauthorized(message: string = "Não autorizado") {
        return new ApiException(message, 401);
    }

    static forbidden(message: string = "Acesso negado") {
        return new ApiException(message, 403);
    }

    static internal(message: string = "Erro interno do servidor") {
        return new ApiException(message, 500);
    }
}

export default ApiException;