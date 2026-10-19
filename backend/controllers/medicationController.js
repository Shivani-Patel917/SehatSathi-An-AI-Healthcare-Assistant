
import mongoose from "mongoose";
import Medication from "../models/Medication.js";

const ALLOWED_FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "As needed",
  "As directed",
  "Other",
];

const MAX_REMINDER_TIMES = 8;

/**
 * Ensure the request body is a plain object.
 */
function getRequestBody(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return {};
  }

  return body;
}

/**
 * Validate a real calendar date in YYYY-MM-DD format.
 */
function isValidDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validate a complete medication object.
 */
function validateMedication(body) {
  const {
    name,
    dosage,
    frequency,
    instructions = "",
    startDate,
    endDate = "",
    reminderTimes = [],
    isActive = true,
  } = body;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 120
  ) {
    return "Medication name must contain 2–120 characters.";
  }

  if (
    typeof dosage !== "string" ||
    dosage.trim().length === 0 ||
    dosage.trim().length > 250
  ) {
    return "Enter dosage instructions supplied by your clinician.";
  }

  if (!ALLOWED_FREQUENCIES.includes(frequency)) {
    return "Select a valid frequency.";
  }

  if (
    typeof instructions !== "string" ||
    instructions.length > 1000
  ) {
    return "Instructions cannot exceed 1000 characters.";
  }

  if (!isValidDate(startDate)) {
    return "Enter a valid start date.";
  }

  if (
    endDate !== "" &&
    !isValidDate(endDate)
  ) {
    return "Enter a valid end date.";
  }

  // YYYY-MM-DD strings can be compared lexicographically.
  if (endDate && endDate < startDate) {
    return "End date cannot be before the start date.";
  }

  if (
    !Array.isArray(reminderTimes) ||
    reminderTimes.length > MAX_REMINDER_TIMES ||
    !reminderTimes.every(
      (time) =>
        typeof time === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    )
  ) {
    return "Provide valid reminder times in HH:mm format.";
  }

  if (
    new Set(reminderTimes).size !==
    reminderTimes.length
  ) {
    return "Reminder times must be unique.";
  }

  if (typeof isActive !== "boolean") {
    return "isActive must be true or false.";
  }

  return null;
}

/**
 * Return only medication fields accepted by this API.
 * The user ID is deliberately excluded.
 */
function medicationPayload(body) {
  return {
    name: body.name.trim(),
    dosage: body.dosage.trim(),
    frequency: body.frequency,
    instructions: (body.instructions ?? "").trim(),
    startDate: body.startDate,
    endDate: body.endDate ?? "",
    reminderTimes: body.reminderTimes ?? [],
    isActive: body.isActive ?? true,
  };
}

/**
 * GET /api/medications
 * Retrieve medications belonging to the authenticated user.
 */
export async function getMyMedications(req, res, next) {
  try {
    const medications = await Medication.find({
      user: req.user._id,
    }).sort({
      isActive: -1,
      startDate: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: medications.length,
      medications,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/medications
 * Create a medication for the authenticated user.
 */
export async function createMedication(req, res, next) {
  try {
    const body = getRequestBody(req.body);
    const errorMessage = validateMedication(body);

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const medication = await Medication.create({
      ...medicationPayload(body),
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Medication added successfully.",
      medication,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/medications/:id
 * Update a medication owned by the authenticated user.
 */
export async function updateMedication(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medication ID.",
      });
    }

    const body = getRequestBody(req.body);

    const medication = await Medication.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found.",
      });
    }

    // Merge supplied fields with the existing record.
    // This allows partial updates such as { isActive: false }.
    const candidate = {
      name: body.name ?? medication.name,
      dosage: body.dosage ?? medication.dosage,
      frequency: body.frequency ?? medication.frequency,
      instructions:
        body.instructions ?? medication.instructions,
      startDate: body.startDate ?? medication.startDate,
      endDate: body.endDate ?? medication.endDate,
      reminderTimes:
        body.reminderTimes ?? medication.reminderTimes,
      isActive: body.isActive ?? medication.isActive,
    };

    const errorMessage = validateMedication(candidate);

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    Object.assign(
      medication,
      medicationPayload(candidate)
    );

    // Mongoose schema validation runs on save.
    await medication.save();

    return res.status(200).json({
      success: true,
      message: "Medication updated successfully.",
      medication,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/medications/:id
 * Delete a medication owned by the authenticated user.
 */
export async function deleteMedication(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medication ID.",
      });
    }

    const medication = await Medication.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medication deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
}
