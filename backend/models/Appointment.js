
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    appointmentDate: {
      type: String, // YYYY-MM-DD in the clinic's local timezone
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    appointmentTime: {
      type: String, // HH:mm, 24-hour format
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({
  patient: 1,
  createdAt: -1,
});

export default mongoose.model("Appointment", appointmentSchema);
