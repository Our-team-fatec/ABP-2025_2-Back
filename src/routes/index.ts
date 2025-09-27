import { Router } from "express";
import userRoutes from "./usersRoutes";
import healthRoutes from "./healthRoutes";
import authRoutes from "./authRoutes";

const routes = Router();
routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/health", healthRoutes);
export default routes;
