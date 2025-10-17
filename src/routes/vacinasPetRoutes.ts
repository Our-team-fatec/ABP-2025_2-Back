import { Router } from "express";
import vacinasPetController from "../controllers/vacinasPetController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de vacinas do pet
router.post("/", vacinasPetController.addVacinaToPet); // Adicionar vacina ao pet
router.get("/:petId/vacinas", vacinasPetController.listPetVacinas); // Listar vacinas do pet
router.get("/:petId/complete", vacinasPetController.getPetComplete); // Buscar pet com info completa
router.put("/vacinas/:id", vacinasPetController.updateVacinaPet); // Atualizar vacina do pet
router.delete("/vacinas/:id", vacinasPetController.deleteVacinaPet); // Deletar vacina do pet

export default router;
