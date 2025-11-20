import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes/index";
import { connectDB, disconnectDB } from "./config/db";
import { notFoundMiddleware } from "./middlewares/notFoundMiddleware";
import { errorMiddleware } from "./middlewares/errorMiddleware";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares globais
app.use(express.json());
app.use(cors());

// Rotas
app.use("/api", routes);

// Middlewares personalizados
app.use(notFoundMiddleware);
app.use(errorMiddleware);

(async () => {
  await connectDB();

  const host = '0.0.0.0';
  app.listen(PORT as number, host, () => {
    console.log(`🚀 Server ouvindo em http://${host}:${PORT}`);
  });
})();

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});
