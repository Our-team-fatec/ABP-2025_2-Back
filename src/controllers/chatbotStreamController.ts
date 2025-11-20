import { Request, Response } from "express";
import { spawn, ChildProcess } from "child_process";
import path from "path";

interface ChatRequest {
  message: string;
  conversationId?: string;
}

const activeChatbots: Map<string, ChildProcess> = new Map();
const MAX_ACTIVE_CHATBOTS = 10; // Limite de processos simultâneos
const CHATBOT_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutos de inatividade
const chatbotTimers: Map<string, NodeJS.Timeout> = new Map();

class ChatbotStreamController {
  private getChatbotProcess(conversationId: string): ChildProcess {
    // Limpar timer de inatividade se já existe
    this.resetIdleTimer(conversationId);

    if (!activeChatbots.has(conversationId)) {
      // Verificar limite de processos ativos
      if (activeChatbots.size >= MAX_ACTIVE_CHATBOTS) {
        // Remover o processo mais antigo
        const oldestId = activeChatbots.keys().next().value;
        this.killChatbot(oldestId);
      }

      const pythonScript = path.join(__dirname, "..", "IA", "main.py");
      const python = spawn("python", [pythonScript, "--api"]);

      activeChatbots.set(conversationId, python);

      python.on("close", () => {
        this.cleanupChatbot(conversationId);
      });

      python.on("error", (error) => {
        console.error(`[Chatbot Stream ${conversationId}] Erro no processo:`, error);
        this.cleanupChatbot(conversationId);
      });

      python.stderr.on("data", (data) => {
        console.error(`[Chatbot Stream ${conversationId}] Erro:`, data.toString());
      });

      // Configurar timer de inatividade
      this.resetIdleTimer(conversationId);
    }

    return activeChatbots.get(conversationId)!;
  }

  private resetIdleTimer(conversationId: string): void {
    // Limpar timer existente
    if (chatbotTimers.has(conversationId)) {
      clearTimeout(chatbotTimers.get(conversationId)!);
    }

    // Criar novo timer de inatividade
    const timer = setTimeout(() => {
      console.log(`[Chatbot Stream ${conversationId}] Timeout por inatividade`);
      this.killChatbot(conversationId);
    }, CHATBOT_IDLE_TIMEOUT);

    chatbotTimers.set(conversationId, timer);
  }

  private cleanupChatbot(conversationId: string): void {
    if (chatbotTimers.has(conversationId)) {
      clearTimeout(chatbotTimers.get(conversationId)!);
      chatbotTimers.delete(conversationId);
    }
    activeChatbots.delete(conversationId);
  }

  private killChatbot(conversationId: string): void {
    const python = activeChatbots.get(conversationId);
    if (python) {
      python.kill();
      this.cleanupChatbot(conversationId);
    }
  }

  private generateConversationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `conv_${timestamp}_${random}`;
  }

  public async chatStream(req: Request, res: Response): Promise<void> {
    const { message, conversationId } = req.body as ChatRequest;

    if (!message || message.trim() === "") {
      res.status(400).json({ error: "Mensagem é obrigatória" });
      return;
    }

    if (message.length > 5000) {
      res.status(400).json({ error: "Mensagem muito longa (máximo 5000 caracteres)" });
      return;
    }

    const convId = conversationId || this.generateConversationId();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.write(`data: ${JSON.stringify({ type: "start", conversationId: convId })}\n\n`);

    try {
      const python = this.getChatbotProcess(convId);
      let buffer = "";

      const onData = (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line);

              if (chunk.type === "chunk") {
                res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk.text })}\n\n`);
              } else if (chunk.type === "done") {
                res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
                res.end();
                python.stdout?.removeListener("data", onData);
              } else if (chunk.type === "error") {
                res.write(`data: ${JSON.stringify({ type: "error", error: chunk.error })}\n\n`);
                res.end();
                python.stdout?.removeListener("data", onData);
              }
            } catch (e) {
              console.error("Erro ao parsear chunk:", e);
            }
          }
        }
      };

      python.stdout?.on("data", onData);

      const command = {
        command: "stream_chat",
        message: message,
      };
      python.stdin?.write(JSON.stringify(command) + "\n");

      // Timeout reduzido para 20s - evita travar outras requisições
      const timeout = setTimeout(() => {
        python.stdout?.removeListener("data", onData);
        res.write(`data: ${JSON.stringify({ type: "error", error: "Timeout - tente uma pergunta mais simples" })}\n\n`);
        res.end();
      }, 20000);

      res.on("close", () => {
        clearTimeout(timeout);
        python.stdout?.removeListener("data", onData);
      });
    } catch (error) {
      console.error("Erro no chat stream:", error);
      res.write(
        `data: ${JSON.stringify({ type: "error", error: "Erro interno do servidor" })}\n\n`,
      );
      res.end();
    }
  }

  public async clearConversation(req: Request, res: Response): Promise<Response> {
    try {
      const { conversationId } = req.params;

      if (activeChatbots.has(conversationId)) {
        const python = activeChatbots.get(conversationId)!;
        python.kill();
        activeChatbots.delete(conversationId);
      }

      return res.json({
        status: "success",
        message: "Conversa limpa com sucesso",
        data: null,
      });
    } catch (error) {
      console.error("Erro ao limpar conversa:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao limpar conversa",
        code: 500,
      });
    }
  }
}

export default new ChatbotStreamController();
