import { Router } from "express";
import { sendAIMessage } from "../controllers/aiChatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/chat", protect, sendAIMessage);

export default router;