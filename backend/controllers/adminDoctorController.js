
import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";

const allowedFields = [
  "name",
  "specialty",
  "qualifications",
  "experienceYears",
  "consultationFee",
  "about",
  "phone",
  "availableDays",
  "availableSlots",
  "isActive",
];

export async function getAdminDoctors(req, res) {
  try {
    const doctors = await Doctor.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      doctors,
    });
  } catch (error) {
    console.error("Get admin doctors error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load doctors.",
    });
  }
}

export async function createDoctor(req, res) {
  try {
    const { user: userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid doctor user ID is required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "The specified user account was not found.",
      });
    }

    if (user.role !== "doctor") {
      return res.status(400).json({
        success: false,
        message: "The selected account must have the doctor role.",
      });
    }

    const existingProfile = await Doctor.findOne({ user: user._id });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "This user already has a doctor profile.",
      });
    }

    const doctorData = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        doctorData[field] = req.body[field];
      }
    }

    const doctor = await Doctor.create({
      ...doctorData,
      user: user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully.",
      doctor,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A doctor profile already exists for this user.",
      });
    }

    console.error("Create doctor error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to add doctor.",
    });
  }
}

export async function updateDoctor(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const updates = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update.",
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully.",
      doctor,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update doctor error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update doctor.",
    });
  }
}

export async function deactivateDoctor(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor deactivated successfully.",
      doctor,
    });
  } catch (error) {
    console.error("Deactivate doctor error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to deactivate doctor.",
    });
  }
}
