import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import aiRoutes from "./routes/ai.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import predictRoutes from "./routes/predict.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import { ensureAuthIndexes } from "./services/auth.service.js";
import { connectToMongo } from "./services/mongo.service.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((origin) => origin.trim()),
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", authRoutes);
app.use("/api", requireAuth, aiRoutes);
app.use("/api", requireAuth, predictRoutes);
app.use("/api", requireAuth, salesRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || "Unexpected server error",
  });
});

async function startServer() {
  await connectToMongo();
  await ensureAuthIndexes();

  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
