import { Router } from "express";
import {
  getAccuracy,
  getAnalytics,
  getCatalog,
  getRiskDashboard,
  postDataset,
  getSalesHistory
} from "../controllers/forecast.controller.js";

const router = Router();

router.get("/sales-history", getSalesHistory);
router.get("/accuracy", getAccuracy);
router.get("/analytics", getAnalytics);
router.get("/catalog", getCatalog);
router.get("/risk-dashboard", getRiskDashboard);
router.post("/dataset", postDataset);

export default router;
