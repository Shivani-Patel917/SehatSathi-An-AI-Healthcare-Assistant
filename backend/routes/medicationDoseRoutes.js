
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  generateMyDailyDoses,
  getMyDailyDoses,
  updateMyDoseStatus,
} from "../controllers/medicationDoseController.js";

const router = Router();

// All medication-dose routes require authentication.
router.use(protect);

// Generate scheduled doses for a particular date.
router.post("/generate", generateMyDailyDoses);

// Retrieve the authenticated user's doses for a particular date.
router.get("/", getMyDailyDoses);

// Update a dose's status.
router.patch("/:id", updateMyDoseStatus);

export default router;