import { Router } from "express";
import petsController from "../controllers/petsController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// Rotas públicas
router.get("/public", petsController.getAllPets); // Listar todos os pets para adoção

// Rotas protegidas (requerem autenticação)
router.post("/", authMiddleware, petsController.createPet); // Criar pet
router.get("/", authMiddleware, petsController.getUserPets); // Listar pets do usuário
router.get("/:id", authMiddleware, petsController.getPetById); // Buscar pet por ID
router.put("/:id", authMiddleware, petsController.updatePet); // Atualizar pet
router.delete("/:id", authMiddleware, petsController.deletePet); // Deletar pet

export default router;
