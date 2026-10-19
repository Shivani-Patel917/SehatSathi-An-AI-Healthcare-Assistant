import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getMyMedications,
  createMedication,
  updateMedication,
  deleteMedication,
} from "../controllers/medicationController.js";

const router = Router();

router.use(protect);

router.get("/", getMyMedications);
router.post("/", createMedication);
router.patch("/:id", updateMedication);
router.delete("/:id", deleteMedication);

export default router;