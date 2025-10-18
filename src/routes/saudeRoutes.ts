import { Router } from "express";
import saudeController from "../controllers/saudeController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de saúde
router.post("/", saudeController.createSaude); // Criar registro de saúde
router.get("/:petId", saudeController.getSaudeByPetId); // Buscar saúde por pet ID
router.put("/:petId", saudeController.updateSaude); // Atualizar saúde
router.delete("/:petId", saudeController.deleteSaude); // Deletar registro de saúde

export default router;
