import mongoose from "mongoose";

export async function connectDB(uri: string) {
  if (!uri) throw new Error("MongoDB URI não informado.");
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log("✅ MongoDB conectado");
  } catch (error) {
    console.error("❌ Erro ao conectar no MongoDB:", error);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
