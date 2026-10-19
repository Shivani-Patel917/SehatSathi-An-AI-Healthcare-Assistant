
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    specialty: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    qualifications: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    experienceYears: {
      type: Number,
      required: true,
      min: 0,
      max: 80,
    },

    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },

    about: {
      type: String,
      default: "",
      maxlength: 1000,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 20,
    },

    availableDays: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },

    availableSlots: {
      type: [String],
      default: ["09:00", "10:00", "11:00", "14:00", "15:00"],
      validate: {
        validator: (slots) =>
          Array.isArray(slots) &&
          slots.every((slot) =>
            /^([01]\d|2[0-3]):[0-5]\d$/.test(slot)
          ),
        message: "Time slots must use HH:mm format.",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
