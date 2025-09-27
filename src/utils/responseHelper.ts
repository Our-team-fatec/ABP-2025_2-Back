
class ResponseHelper {
    static success(message: string, data?: any) {
        return {
            status: "success",
            message,
            data: data || null,
        };
    }
    
    static error(message: string, code: number = 500) {
        return {
            status: "error",
            message,
            code,
        };
    }
}

export default ResponseHelper;