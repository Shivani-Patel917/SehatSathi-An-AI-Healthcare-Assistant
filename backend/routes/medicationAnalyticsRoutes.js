
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMedicationAdherence,
} from "../controllers/medicationAnalyticsController.js";

const router = Router();

router.use(protect);

router.get("/adherence", getMedicationAdherence);

export default router;
