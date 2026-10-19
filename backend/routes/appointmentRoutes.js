
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
} from "../controllers/appointmentController.js";

const router = Router();

router.use(protect);

// Book an appointment
router.post("/", bookAppointment);

// Fetch all appointments belonging to the logged-in patient
router.get("/", getMyAppointments);

// Fetch one appointment by ID
router.get("/:id", getAppointmentById);

// Cancel an appointment
router.patch("/:id/cancel", cancelAppointment);

export default router;
