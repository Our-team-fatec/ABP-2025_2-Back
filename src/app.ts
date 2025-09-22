import express from "express";
import dotenv from "dotenv";
import healthRouter from "./routes/health";
import { connectDB, disconnectDB } from "./config/db";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(healthRouter);

(async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server ouvindo em http://localhost:${PORT}`);
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
