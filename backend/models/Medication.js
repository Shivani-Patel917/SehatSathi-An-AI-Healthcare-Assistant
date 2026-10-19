import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Medication name is required."],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    dosage: {
      type: String,
      required: [true, "Dosage instructions are required."],
      trim: true,
      maxlength: 250,
    },

    frequency: {
      type: String,
      required: [true, "Frequency is required."],
      enum: [
        "Once daily",
        "Twice daily",
        "Three times daily",
        "Four times daily",
        "As needed",
        "As directed",
        "Other",
      ],
    },

    instructions: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    endDate: {
      type: String,
      default: "",
      match: [/^$|^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for the end date."],
    },

    reminderTimes: {
      type: [String],
      default: [],
      validate: {
        validator: (times) =>
          times.every((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)),
        message: "Reminder times must use HH:mm format.",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

medicationSchema.index({ user: 1, isActive: 1, startDate: 1 });

export default mongoose.model("Medication", medicationSchema);