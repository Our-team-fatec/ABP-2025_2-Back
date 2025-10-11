import { Router } from "express";
import userRoutes from "./usersRoutes";
import healthRoutes from "./healthRoutes";
import authRoutes from "./authRoutes";
import petsRoutes from "./petsRoutes";
import adocoesRoutes from "./adocoesRoutes";

const routes = Router();
routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/pets", petsRoutes);
routes.use("/adocoes", adocoesRoutes);
routes.use("/health", healthRoutes);
export default routes;
