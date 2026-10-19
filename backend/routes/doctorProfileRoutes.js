
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireDoctor } from "../middleware/doctorMiddleware.js";
import {
  getMyDoctorProfile,
  updateMyDoctorProfile,
} from "../controllers/doctorProfileController.js";

const router = Router();

router.use(protect);
router.use(requireDoctor);

router.get("/", getMyDoctorProfile);
router.patch("/", updateMyDoctorProfile);

export default router;
