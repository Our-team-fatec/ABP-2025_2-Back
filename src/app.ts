import express from "express";
import dotenv from "dotenv";
import healthRouter from "./routes/health";
import { connectDB } from "./config/db";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "";

const app = express();
app.use(express.json());

app.use(healthRouter);

(async () => {
  try {
    await connectDB(MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Server ouvindo em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Erro ao iniciar aplicação:", err);
    process.exit(1);
  }
})();
