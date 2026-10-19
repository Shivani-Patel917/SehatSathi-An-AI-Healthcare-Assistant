
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getHealthAnalytics } from "../controllers/healthAnalyticsController.js";

const router = Router();

router.use(protect);
router.get("/health", getHealthAnalytics);

export default router;
