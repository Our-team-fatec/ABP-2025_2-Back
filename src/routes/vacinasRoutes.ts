import { Router } from "express";
import vacinasController from "../controllers/vacinasController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de vacinas
router.get("/", vacinasController.listVacinas); // Listar todas as vacinas (com filtro opcional por espécie)
router.get("/:id", vacinasController.getVacinaById); // Buscar vacina por ID
router.post("/", vacinasController.createVacina); // Criar nova vacina
router.put("/:id", vacinasController.updateVacina); // Atualizar vacina
router.delete("/:id", vacinasController.deleteVacina); // Deletar vacina (soft delete)

export default router;
