
import Conversation from "../models/Conversation.js";
import AIActivity from "../models/AIActivity.js";
import { generateHealthReply } from "../services/aiService.js";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 12;

function publicMessages(conversation) {
  return conversation.messages.map((message) => ({
    id: message._id.toString(),
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  }));
}

// Record operational metadata only. Never log health conversations.
async function logAIActivity({
  userId,
  status,
  durationMs,
}) {
  try {
    await AIActivity.create({
      user: userId,
      action: "chat",
      status,
      provider: "ollama",
      model: process.env.OLLAMA_MODEL || "llama3.2:1b",
      durationMs,
      errorMessage:
        status === "failed"
          ? "AI provider request failed."
          : null,
    });
  } catch (error) {
    // Logging failures must not break the chatbot.
    console.error("AI activity logging error:", error.message);
  }
}

// GET /api/tutor/history
export async function getHistory(req, res) {
  try {
    const conversation = await Conversation.findOne({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      messages: conversation ? publicMessages(conversation) : [],
    });
  } catch (error) {
    console.error("Tutor history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load conversation history.",
    });
  }
}

// POST /api/tutor/chat
export async function sendMessage(req, res) {
  const startedAt = Date.now();
  let activityLogged = false;

  try {
    const { message } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message.",
      });
    }

    const cleanMessage = message.trim();

    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    let conversation = await Conversation.findOne({
      user: req.user._id,
    });

    if (!conversation) {
      conversation = new Conversation({
        user: req.user._id,
        messages: [],
      });
    }

    const context = conversation.messages
      .slice(-MAX_HISTORY_MESSAGES)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    const reply = await generateHealthReply([
      ...context,
      { role: "user", content: cleanMessage },
    ]);

    conversation.messages.push(
  {
    role: "user",
    content: cleanMessage,
  },
  {
    role: "assistant",
    content: reply,
  }
);

// Keep the most recent 100 messages
if (conversation.messages.length > 100) {
  conversation.messages = conversation.messages.slice(-100);
}

// Save both messages in MongoDB
await conversation.save();

console.log("Conversation saved:", {
  conversationId: conversation._id,
  userId: conversation.user,
  messageCount: conversation.messages.length,
});

    activityLogged = true;

    return res.status(200).json({
      success: true,
      userMessage: {
        role: "user",
        content: cleanMessage,
      },
      assistantMessage: {
        role: "assistant",
        content: reply,
      },
    });
  } catch (error) {
    console.error("Tutor chat error:", error.message);

    if (!activityLogged) {
      await logAIActivity({
        userId: req.user?._id,
        status: "failed",
        durationMs: Date.now() - startedAt,
      });
    }

    if (
      error.name === "TimeoutError" ||
      error.name === "AbortError"
    ) {
      return res.status(504).json({
        success: false,
        message:
          "The AI service took too long to respond. Please try again.",
      });
    }

    return res.status(502).json({
      success: false,
      message:
        "The AI assistant is temporarily unavailable. Please try again later.",
    });
  }
}

// DELETE /api/tutor/history
export async function clearHistory(req, res) {
  try {
    await Conversation.deleteOne({ user: req.user._id });

    return res.status(200).json({
      success: true,
      message: "Conversation history cleared.",
    });
  } catch (error) {
    console.error("Clear tutor history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to clear conversation history.",
    });
  }
}