
import mongoose from "mongoose";

const medicationDoseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true,
    },

    scheduledDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    scheduledTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    status: {
      type: String,
      enum: ["pending", "taken", "skipped"],
      default: "pending",
      required: true,
    },

    takenAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent duplicate records for the same scheduled medication dose.
medicationDoseSchema.index(
  {
    medication: 1,
    scheduledDate: 1,
    scheduledTime: 1,
  },
  { unique: true }
);

medicationDoseSchema.index({
  user: 1,
  scheduledDate: 1,
  status: 1,
});

export default mongoose.model(
  "MedicationDose",
  medicationDoseSchema
);
