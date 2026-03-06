import { Router } from "express";
import {
  getAnalytics,
  getCatalog,
  getSalesHistory
} from "../controllers/forecast.controller.js";

const router = Router();

router.get("/sales-history", getSalesHistory);
router.get("/analytics", getAnalytics);
router.get("/catalog", getCatalog);

export default router;