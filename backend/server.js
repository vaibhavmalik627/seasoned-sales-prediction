import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import predictRoutes from "./routes/predict.routes.js";
import salesRoutes from "./routes/sales.routes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", predictRoutes);
app.use("/api", salesRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || "Unexpected server error"
  });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});