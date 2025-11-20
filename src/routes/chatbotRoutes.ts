import { Router } from "express";
import chatbotController from "../controllers/chatbotController";
import chatbotStreamController from "../controllers/chatbotStreamController";
import { timeoutMiddleware } from "../middlewares/timeoutMiddleware";

const router = Router();

// Aplicar timeout de 12 segundos nas rotas de chat
router.post(
  "/chat",
  timeoutMiddleware(12000),
  chatbotController.chat.bind(chatbotController),
);

// Nova rota de streaming (timeout maior pois é streaming)
router.post(
  "/chat/stream",
  timeoutMiddleware(25000),
  chatbotStreamController.chatStream.bind(chatbotStreamController),
);

router.post(
  "/conversation/:conversationId/clear",
  chatbotController.clearConversation.bind(chatbotController),
);

router.get(
  "/conversation/:conversationId/history",
  chatbotController.getHistory.bind(chatbotController),
);

router.delete(
  "/conversation/:conversationId",
  chatbotController.endConversation.bind(chatbotController),
);

router.get("/conversations", chatbotController.listConversations.bind(chatbotController));

router.get("/health", chatbotController.healthCheck.bind(chatbotController));

export default router;
