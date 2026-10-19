
import ContactMessage from "../models/ContactMessage.js";

// POST /api/contact — public contact form submission
export async function submitContactMessage(req, res) {
  try {
    const { name, email, subject, message } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all contact form fields.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (
      cleanName.length > 100 ||
      cleanSubject.length > 150 ||
      cleanMessage.length > 5000 ||
      cleanEmail.length > 254
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed the allowed length.",
      });
    }

    // Correct email validation regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    await ContactMessage.create({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully.",
    });
  } catch (error) {
    console.error("Submit contact message error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit your message. Please try again.",
    });
  }
}

// GET /api/contact — admin only
export async function getContactMessages(req, res) {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get contact messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve contact enquiries.",
    });
  }
}

// PATCH /api/contact/:id — admin only
export async function updateContactMessageStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};

    const allowedStatuses = ["new", "in-progress", "resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be new, in-progress, or resolved.",
      });
    }

    const updatedMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully.",
      enquiry: updatedMessage,
    });
  } catch (error) {
    // Mongoose reports an invalid MongoDB ID as a CastError.
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid contact enquiry ID.",
      });
    }

    console.error("Update contact status error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update enquiry status.",
    });
  }
}
