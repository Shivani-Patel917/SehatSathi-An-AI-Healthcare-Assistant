
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getHealthMetrics,
  createHealthMetric,
  deleteHealthMetric,
} from "../controllers/healthMetricController.js";

const router = Router();

router.use(protect);

router.get("/", getHealthMetrics);
router.post("/", createHealthMetric);
router.delete("/:id", deleteHealthMetric);

export default router;
