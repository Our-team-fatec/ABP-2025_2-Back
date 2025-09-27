import { Router } from "express";
import authController from "../controllers/authController";

const routes = Router();

// POST /login - Endpoint para login de usuários
routes.post("/login", authController.login);

// POST /refresh-token - Endpoint para renovar access token
routes.post("/refresh-token", authController.refreshToken);

export default routes;
