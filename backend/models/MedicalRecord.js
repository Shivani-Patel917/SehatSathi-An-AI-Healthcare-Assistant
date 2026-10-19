
import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    recordType: {
      type: String,
      required: true,
      enum: [
        "Blood Test",
        "Prescription",
        "Medical Report",
        "X-Ray",
        "MRI",
        "CT Scan",
        "Discharge Summary",
        "Vaccination",
        "Other",
      ],
      default: "Medical Report",
    },

    recordDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    provider: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    originalName: {
      type: String,
      default: "",
    },

    storedName: {
      type: String,
      default: "",
      select: false,
    },

    storagePath: {
      type: String,
      default: "",
      select: false,
    },

    mimeType: {
      type: String,
      default: "",
    },

    size: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ user: 1, recordDate: -1 });

const MedicalRecord =
  mongoose.models.MedicalRecord ||
  mongoose.model("MedicalRecord", medicalRecordSchema);

export default MedicalRecord;
