import { Router } from "express";
import chatbotController from "../controllers/chatbotController";

const router = Router();

router.post("/chat", chatbotController.chat.bind(chatbotController));

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
