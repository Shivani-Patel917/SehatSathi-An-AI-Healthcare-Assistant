
import { Router } from "express";
import {
  submitContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} from "../controllers/contactController.js";
import {
  protect,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = Router();

// Public endpoint: submit a contact form
router.post("/", submitContactMessage);

// Admin-only endpoints
router.get("/", protect, requireAdmin, getContactMessages);
router.patch("/:id", protect, requireAdmin, updateContactMessageStatus);

// Existing route-registration test
router.get("/test", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Contact routes are registered.",
  });
});

export default router;
