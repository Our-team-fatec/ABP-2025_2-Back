import { Router } from "express";
import userRoutes from "./usersRoutes";
import healthRoutes from "./healthRoutes";

const routes = Router();

routes.use("/users", userRoutes);
routes.use("/health", healthRoutes);
export default routes;
