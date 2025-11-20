import { Router } from "express";
import petsController from "../controllers/petsController";
import authMiddleware from "../middlewares/authMiddleware";
import { preserveBody } from "../middlewares/uploadMiddleware";

const router = Router();

// Rotas públicas
router.get("/public", petsController.getAllPets); // Listar todos os pets para adoção

// Rotas protegidas (requerem autenticação)
router.get("/search", authMiddleware, petsController.searchPetsByName); // Buscar pets por nome
router.post("/", authMiddleware, preserveBody("images"), petsController.createPet); // Criar pet com múltiplas imagens
router.get("/", authMiddleware, petsController.getUserPets); // Listar pets do usuário
router.get("/:id", authMiddleware, petsController.getPetById); // Buscar pet por ID
router.get("/:id/images/status", authMiddleware, petsController.getPetImageStatus); // Verificar status das imagens
router.put("/:id", authMiddleware, preserveBody("images"), petsController.updatePet); // Atualizar pet com múltiplas imagens
router.delete("/:id", authMiddleware, petsController.deletePet); // Deletar pet
router.delete("/:petId/images/:imageId", authMiddleware, petsController.deleteImage); // Deletar imagem específica

export default router;
