import { Router } from "express";
import {
  getForecast,
  getReorderRecommendation,
  predictDemand
} from "../controllers/forecast.controller.js";

const router = Router();

router.post("/predict", predictDemand);
router.post("/reorder-recommendation", getReorderRecommendation);
router.get("/forecast", getForecast);

export default router;
