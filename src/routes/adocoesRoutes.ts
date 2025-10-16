import { Router } from "express";
import adocoesController from "../controllers/adocoesController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas públicas (autenticado mas sem restrições)
router.get("/", adocoesController.listAdocoes); // Listar todas as adoções disponíveis
router.get("/my-adocoes", adocoesController.getMyAdocoes); // Listar adoções do usuário autenticado
router.get("/:id", adocoesController.getAdocaoById); // Buscar adoção por ID

// Rotas privadas (requerem que o usuário seja dono do recurso)
router.post("/", adocoesController.createAdocao); // Criar anúncio de adoção
router.put("/:id", adocoesController.updateAdocao); // Atualizar anúncio de adoção
router.delete("/:id", adocoesController.deleteAdocao); // Remover anúncio de adoção
router.patch("/:id/adotar", adocoesController.markAsAdoptado); // Marcar pet como adotado

export default router;
