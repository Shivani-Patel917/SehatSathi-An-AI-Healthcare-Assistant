
import mongoose from "mongoose";

const healthMetricSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["weight", "blood-pressure", "blood-glucose"],
      required: true,
    },

    // Used for weight and blood glucose.
    value: {
      type: Number,
      min: 0,
    },

    // Used for blood pressure.
    systolic: {
      type: Number,
      min: 1,
      max: 350,
    },

    diastolic: {
      type: Number,
      min: 1,
      max: 250,
    },

    unit: {
      type: String,
      enum: ["kg", "mg/dL", "mmHg"],
      required: true,
    },

    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
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

healthMetricSchema.index({ user: 1, type: 1, recordedAt: -1 });

export default mongoose.model("HealthMetric", healthMetricSchema);
