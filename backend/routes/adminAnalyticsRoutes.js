
import { Router } from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import { getAdminAnalytics } from "../controllers/adminAnalyticsController.js";

const router = Router();

router.use(protect, requireAdmin);
router.get("/", getAdminAnalytics);

export default router;
