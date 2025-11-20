import { Request, Response } from "express";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import ResponseHelper from "../utils/responseHelper";

interface ChatRequest {
  message: string;
  conversationId?: string;
}

interface PythonCommand {
  command: string;
  message?: string;
}

interface PythonResponse {
  success: boolean;
  response?: string;
  error?: string;
  message?: string;
  history?: Array<{ role: string; content: string }>;
}

const activeChatbots: Map<string, ChildProcess> = new Map();

class ChatbotController {
  private getChatbotProcess(conversationId: string): ChildProcess {
    if (!activeChatbots.has(conversationId)) {
      const pythonScript = path.join(__dirname, "..", "IA", "main.py");
      const python = spawn("python", [pythonScript, "--api"]);

      activeChatbots.set(conversationId, python);

      python.on("close", () => {
        activeChatbots.delete(conversationId);
      });

      python.stderr.on("data", (data) => {
        console.error(`[Chatbot ${conversationId}] Erro:`, data.toString());
      });
    }

    return activeChatbots.get(conversationId)!;
  }

  private async sendCommand(
    python: ChildProcess,
    command: string,
    message?: string,
  ): Promise<PythonResponse> {
    return new Promise((resolve, reject) => {
      let responseData = "";
      const timeout = setTimeout(() => {
        reject(new Error("Timeout ao aguardar resposta do chatbot"));
      }, 30000);

      const onData = (data: Buffer) => {
        responseData += data.toString();
        try {
          const response = JSON.parse(responseData);
          clearTimeout(timeout);
          python.stdout?.removeListener("data", onData);
          resolve(response);
        } catch {
          // Ignora erros de parse enquanto aguarda dados completos
        }
      };

      const onError = (data: Buffer) => {
        clearTimeout(timeout);
        reject(new Error(data.toString()));
      };

      python.stdout?.on("data", onData);
      python.stderr?.once("data", onError);

      const cmd: PythonCommand = { command, message };
      python.stdin?.write(JSON.stringify(cmd) + "\n");
    });
  }

  public async chat(req: Request, res: Response): Promise<Response> {
    try {
      console.log("📨 Recebendo mensagem do chatbot:", req.body);

      const { message, conversationId } = req.body as ChatRequest;

      if (!message || message.trim() === "") {
        return res.status(400).json(ResponseHelper.error("Mensagem é obrigatória", 400));
      }

      if (message.length > 5000) {
        return res
          .status(400)
          .json(ResponseHelper.error("Mensagem muito longa (máximo 5000 caracteres)", 400));
      }

      const convId = conversationId || this.generateConversationId();
      console.log("🆔 Conversation ID:", convId);

      const python = this.getChatbotProcess(convId);

      console.log("🤖 Enviando para IA...");
      const result = await this.sendCommand(python, "chat", message);
      console.log("✅ Resposta da IA recebida");

      if (!result.success) {
        return res.status(500).json(ResponseHelper.error("Erro ao processar mensagem com IA", 500));
      }

      return res.json(
        ResponseHelper.success("Mensagem processada com sucesso", {
          response: result.response,
          conversationId: convId,
        }),
      );
    } catch (error) {
      console.error("❌ Erro no chatbot:", error);
      return res.status(500).json(ResponseHelper.error("Erro interno no chatbot", 500));
    }
  }

  public async clearConversation(req: Request, res: Response): Promise<Response> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json(ResponseHelper.error("ID da conversa é obrigatório", 400));
      }

      const python = activeChatbots.get(conversationId);

      if (!python) {
        return res.status(404).json(ResponseHelper.error("Conversa não encontrada", 404));
      }

      await this.sendCommand(python, "reset");

      return res.json(ResponseHelper.success("Conversa limpa com sucesso"));
    } catch (error) {
      console.error("Erro ao limpar conversa:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao limpar conversa", 500));
    }
  }
  public async getHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json(ResponseHelper.error("ID da conversa é obrigatório", 400));
      }

      const python = activeChatbots.get(conversationId);

      if (!python) {
        return res.status(404).json(ResponseHelper.error("Conversa não encontrada", 404));
      }

      // Enviar comando de histórico
      const result = await this.sendCommand(python, "history");

      if (!result.success) {
        return res.status(500).json(ResponseHelper.error("Erro ao buscar histórico", 500));
      }

      return res.json(
        ResponseHelper.success("Histórico recuperado com sucesso", {
          history: result.history,
          totalMessages: result.history?.length || 0,
        }),
      );
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao buscar histórico", 500));
    }
  }

  public async endConversation(req: Request, res: Response): Promise<Response> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json(ResponseHelper.error("ID da conversa é obrigatório", 400));
      }

      const python = activeChatbots.get(conversationId);

      if (python) {
        python.kill();
        activeChatbots.delete(conversationId);
      }

      return res.json(ResponseHelper.success("Conversa finalizada com sucesso"));
    } catch (error) {
      console.error("Erro ao finalizar conversa:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao finalizar conversa", 500));
    }
  }

  public async listConversations(req: Request, res: Response): Promise<Response> {
    try {
      const conversations = Array.from(activeChatbots.keys());

      return res.json(
        ResponseHelper.success("Conversas ativas recuperadas", {
          conversations,
          total: conversations.length,
        }),
      );
    } catch (error) {
      console.error("Erro ao listar conversas:", error);
      return res.status(500).json(ResponseHelper.error("Erro ao listar conversas", 500));
    }
  }

  public async healthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const activeConversations = activeChatbots.size;
      const geminiApiKey = process.env.GEMINI_API_KEY;

      return res.json(
        ResponseHelper.success("Chatbot operacional", {
          status: "healthy",
          activeConversations,
          geminiConfigured: !!geminiApiKey,
        }),
      );
    } catch {
      return res.status(500).json(ResponseHelper.error("Chatbot indisponível", 500));
    }
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new ChatbotController();

// - `POST /chat` - Enviar mensagem
// - `GET /health` - Health check
// - `GET /conversations` - Listar conversas ativas
// - `GET /conversation/:id/history` - Ver histórico
// - `POST /conversation/:id/clear` - Limpar histórico
// - `DELETE /conversation/:id` - Finalizar conversa
