
import mongoose from "mongoose";
import Medication from "../models/Medication.js";
import MedicationDose from "../models/MedicationDose.js";

const VALID_STATUSES = ["pending", "taken", "skipped"];

function getTodayLocalDate() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function readDate(req, res) {
  const date = req.query.date ?? getTodayLocalDate();

  if (!isValidDate(date)) {
    res.status(400).json({
      success: false,
      message: "Date must be a valid date in YYYY-MM-DD format.",
    });
    return null;
  }

  return date;
}

function sendControllerError(res, error, action) {
  console.error(`${action} failed:`, error);

  if (res.headersSent) return;

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate dose record. Check the dose model indexes.",
    });
  }

  return res.status(500).json({
    success: false,
    message: `Could not ${action.toLowerCase()}.`,
  });
}

export async function generateMyDailyDoses(req, res) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to generate medication doses.",
      });
    }

    const date = readDate(req, res);
    if (!date) return;

    const userId = req.user._id;

    const medications = await Medication.find({
      user: userId,
      isActive: true,
      startDate: { $lte: date },
      $or: [
        { endDate: "" },
        { endDate: null },
        { endDate: { $exists: false } },
        { endDate: { $gte: date } },
      ],
      reminderTimes: { $exists: true, $ne: [] },
      frequency: { $nin: ["As needed", "as needed"] },
    }).lean();

    let createdOrMatched = 0;

    for (const medication of medications) {
      const times = Array.isArray(medication.reminderTimes)
        ? [...new Set(medication.reminderTimes)]
        : [];

      for (const time of times) {
        if (
          typeof time !== "string" ||
          !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
        ) {
          console.warn("Skipping invalid reminder time:", {
            medicationId: String(medication._id),
            time,
          });
          continue;
        }

        // Using individual upserts avoids a bulkWrite failure hiding
        // which medication caused a schema or validation error.
        await MedicationDose.updateOne(
          {
            user: userId,
            medication: medication._id,
            scheduledDate: date,
            scheduledTime: time,
          },
          {
            $setOnInsert: {
              user: userId,
              medication: medication._id,
              scheduledDate: date,
              scheduledTime: time,
              status: "pending",
              takenAt: null,
              notes: "",
            },
          },
          { upsert: true, runValidators: true }
        );

        createdOrMatched++;
      }
    }

    const doses = await MedicationDose.find({
      user: userId,
      scheduledDate: date,
    })
      .populate("medication", "name dosage frequency instructions")
      .sort({ scheduledTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Daily dose schedule generated successfully.",
      date,
      processed: createdOrMatched,
      count: doses.length,
      doses,
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Generate daily medication doses"
    );
  }
}

export async function getMyDailyDoses(req, res) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view medication doses.",
      });
    }

    const date = readDate(req, res);
    if (!date) return;

    const doses = await MedicationDose.find({
      user: req.user._id,
      scheduledDate: date,
    })
      .populate("medication", "name dosage frequency instructions")
      .sort({ scheduledTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      date,
      count: doses.length,
      doses,
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Retrieve daily medication doses"
    );
  }
}

export async function updateMyDoseStatus(req, res) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to update medication doses.",
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dose ID.",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be pending, taken, or skipped.",
      });
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Notes must be a string of at most 500 characters.",
      });
    }

    const dose = await MedicationDose.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!dose) {
      return res.status(404).json({
        success: false,
        message: "Dose record not found.",
      });
    }

    const medicationExists = await Medication.exists({
      _id: dose.medication,
      user: req.user._id,
    });

    if (!medicationExists) {
      return res.status(404).json({
        success: false,
        message: "The associated medication no longer exists.",
      });
    }

    dose.status = status;
    dose.takenAt = status === "taken" ? new Date() : null;

    if (notes !== undefined) {
      dose.notes = notes.trim();
    }

    await dose.save();

    const updatedDose = await MedicationDose.findOne({
      _id: dose._id,
      user: req.user._id,
    })
      .populate("medication", "name dosage frequency instructions")
      .lean();

    return res.status(200).json({
      success: true,
      message: `Dose marked as ${status}.`,
      dose: updatedDose,
    });
  } catch (error) {
    return sendControllerError(
      res,
      error,
      "Update medication dose status"
    );
  }
}
