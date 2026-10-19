
import { Router } from "express";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getAllAppointments,
  updateAppointmentStatus,
} from "../controllers/adminAppointmentController.js";

const router = Router();

router.use(protect, requireAdmin);

router.get("/", getAllAppointments);
router.patch("/:id/status", updateAppointmentStatus);

export default router;
