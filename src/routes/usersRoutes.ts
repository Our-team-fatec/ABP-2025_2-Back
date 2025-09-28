import { Router } from "express";
import userController from "../controllers/userController";
import authMiddleware from "../middlewares/authMiddleware";

const routes = Router();

// POST /register - Endpoint para cadastro de usuários
routes.post("/register", userController.registerUser);

// Exemplo de rota protegida - GET /profile
routes.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Perfil do usuário",
    userId: req.body.userId,
    userEmail: req.body.userEmail,
    userGrupo: req.body.userGrupo,
  });
});

export default routes;
