
import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/change-password", changePassword);

export default router;
