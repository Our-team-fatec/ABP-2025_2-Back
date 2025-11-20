import { Router } from "express";
import chatbotController from "../controllers/chatbotController";
import chatbotStreamController from "../controllers/chatbotStreamController";

const router = Router();

router.post("/chat", chatbotController.chat.bind(chatbotController));

// Nova rota de streaming
router.post("/chat/stream", chatbotStreamController.chatStream.bind(chatbotStreamController));

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
