
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getHistory,
  sendMessage,
  clearHistory,
} from "../controllers/tutorController.js";

const router = Router();

router.use(protect);

router.get("/history", getHistory);
router.post("/chat", sendMessage);
router.delete("/history", clearHistory);

export default router;
