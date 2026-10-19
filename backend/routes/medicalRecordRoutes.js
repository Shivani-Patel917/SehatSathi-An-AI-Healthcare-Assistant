
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import uploadMedicalReport from "../middleware/uploadMedicalReport.js";

import {
  getMyMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  downloadMedicalRecord,
} from "../controllers/medicalRecordController.js";

const router = Router();

// All medical-record endpoints require authentication.
router.use(protect);

router.get("/", getMyMedicalRecords);

router.post(
  "/",
  (req, res, next) => {
    uploadMedicalReport.single("file")(req, res, (error) => {
      if (!error) return next();

      const status =
        error.statusCode ||
        (error.code === "LIMIT_FILE_SIZE" ? 413 : 400);

      return res.status(status).json({
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "File size cannot exceed 10 MB."
            : error.message || "Could not upload the report.",
      });
    });
  },
  createMedicalRecord
);

router.get("/:id/download", downloadMedicalRecord);
router.patch("/:id", updateMedicalRecord);
router.delete("/:id", deleteMedicalRecord);

export default router;
