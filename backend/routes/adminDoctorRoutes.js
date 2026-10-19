
import { Router } from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getAdminDoctors,
  createDoctor,
  updateDoctor,
  deactivateDoctor,
} from "../controllers/adminDoctorController.js";

const router = Router();

router.use(protect, requireAdmin);

router.get("/", getAdminDoctors);
router.post("/", createDoctor);
router.patch("/:id", updateDoctor);
router.patch("/:id/deactivate", deactivateDoctor);

export default router;

