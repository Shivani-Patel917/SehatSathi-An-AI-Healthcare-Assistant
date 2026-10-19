import mongoose from "mongoose";
import AIActivity from "../models/AIActivity.js";
import { generateHealthReply } from "../services/aiService.js";

export const sendAIMessage = async (req, res) => {
  const startedAt = Date.now();

  // Works with either optional authentication or required authentication.
  const userId = req.user?._id || req.user?.id || null;

  let status = "success";
  let provider = "configured-provider";
  let model = process.env.AI_MODEL || "unknown";

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid messages array.",
      });
    }

    const reply = await generateHealthReply(messages);

    // Record the successful request without storing health conversations.
    await AIActivity.create({
      user: userId && mongoose.isValidObjectId(userId) ? userId : null,
      action: "chat",
      status,
      provider,
      model,
      durationMs: Date.now() - startedAt,
    });

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    status = "failed";

    console.error("AI chat request failed:", error.message);

    try {
      await AIActivity.create({
        user: userId && mongoose.isValidObjectId(userId) ? userId : null,
        action: "chat",
        status,
        provider,
        model,
        durationMs: Date.now() - startedAt,
        errorMessage: "AI provider request failed.",
      });
    } catch (loggingError) {
      console.error("AI activity logging failed:", loggingError.message);
    }

    return res.status(502).json({
      success: false,
      message: "The AI assistant is temporarily unavailable. Please try again.",
    });
  }
};