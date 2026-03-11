import { Router } from "express";
import {
  deleteChatHistory,
  getChatHistory,
  postDataQuality,
  postDemandStory,
  postForecastInsight,
  postForecastReport,
  postForecastChat,
  postMetricExplanation,
  postInventoryAdvice,
  postRetailQuery,
} from "../controllers/ai.controller.js";

const router = Router();

router.post("/ai/insights", postForecastInsight);
router.post("/ai/inventory-advice", postInventoryAdvice);
router.post("/ai/query", postRetailQuery);
router.post("/ai/data-quality", postDataQuality);
router.post("/ai/report", postForecastReport);
router.post("/ai/story", postDemandStory);
router.post("/ai/metric-explanation", postMetricExplanation);
router.get("/ai/chat/history", getChatHistory);
router.delete("/ai/chat/history", deleteChatHistory);
router.post("/ai/chat", postForecastChat);

export default router;
