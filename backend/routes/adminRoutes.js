
import { Router } from "express";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

import { getAllUsers } from "../controllers/adminController.js";
import { getAdminAnalytics } from "../controllers/adminAnalyticsController.js";
import {
  getAdminAIActivity,
} from "../controllers/adminAIActivityController.js";

const router = Router();

// All admin routes require authentication and admin authorization.
router.use(protect, adminOnly);

// User management
router.get("/users", getAllUsers);

// Analytics dashboard
router.get("/analytics", getAdminAnalytics);

// AI activity monitoring
router.get("/ai-activity", getAdminAIActivity);

export default router;
