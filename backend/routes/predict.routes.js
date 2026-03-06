import { Router } from "express";
import { getForecast, predictDemand } from "../controllers/forecast.controller.js";

const router = Router();

router.post("/predict", predictDemand);
router.get("/forecast", getForecast);

export default router;