
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireDoctor } from "../middleware/doctorMiddleware.js";

import {
  getDoctorAppointments,
  updateDoctorAppointmentStatus,
} from "../controllers/doctorAppointmentController.js";

const router = Router();

router.use(protect, requireDoctor);

router.get("/appointments", getDoctorAppointments);
router.patch("/appointments/:id/status", updateDoctorAppointmentStatus);

export default router;