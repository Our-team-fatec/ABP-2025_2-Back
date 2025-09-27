import { Router } from "express";
import userController from "../controllers/userController";

const routes = Router();

// POST /register - Endpoint para cadastro de usuários
routes.post("/register", userController.registerUser);

export default routes;
