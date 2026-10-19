import mongoose from "mongoose";

const aiActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    action: {
      type: String,
      enum: ["chat", "summary", "health_guidance", "other"],
      default: "chat",
      index: true,
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
      index: true,
    },

    provider: {
      type: String,
      default: "unknown",
      trim: true,
    },

    model: {
      type: String,
      default: "unknown",
      trim: true,
    },

    durationMs: {
      type: Number,
      default: null,
      min: 0,
    },

    errorMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

aiActivitySchema.index({ createdAt: -1 });

export default mongoose.model("AIActivity", aiActivitySchema);