
import Doctor from "../models/Doctor.js";

const allowedFields = [
  "name",
  "specialty",
  "qualifications",
  "experienceYears",
  "consultationFee",
  "about",
  "availableDays",
  "availableSlots",
];

const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const isValidTime = (value) =>
  typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export async function getMyDoctorProfile(req, res) {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        code: "DOCTOR_PROFILE_NOT_FOUND",
        message:
          "No doctor profile is linked to your account. Ask the administrator to link your doctor profile.",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your doctor profile.",
    });
  }
}

export async function updateMyDoctorProfile(req, res) {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        code: "DOCTOR_PROFILE_NOT_FOUND",
        message:
          "No doctor profile is linked to your account. Ask the administrator to link your doctor profile.",
      });
    }

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields were provided.",
      });
    }

    for (const field of [
      "name",
      "specialty",
      "qualifications",
    ]) {
      if (field in updates) {
        if (
          typeof updates[field] !== "string" ||
          !updates[field].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} is required and must be text.`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    if ("about" in updates) {
      if (typeof updates.about !== "string") {
        return res.status(400).json({
          success: false,
          message: "About must be text.",
        });
      }

      updates.about = updates.about.trim();
    }

    for (const field of [
      "experienceYears",
      "consultationFee",
    ]) {
      if (field in updates) {
        const value = updates[field];

        if (
          value === "" ||
          value === null ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-negative number.`,
          });
        }

        updates[field] = Number(value);
      }
    }

    if (
      "experienceYears" in updates &&
      updates.experienceYears > 80
    ) {
      return res.status(400).json({
        success: false,
        message: "Experience cannot exceed 80 years.",
      });
    }

    if ("availableDays" in updates) {
      if (
        !Array.isArray(updates.availableDays) ||
        !updates.availableDays.every((day) =>
          validDays.includes(day)
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Select valid days of the week.",
        });
      }
    }

    if ("availableSlots" in updates) {
      if (
        !Array.isArray(updates.availableSlots) ||
        !updates.availableSlots.every(isValidTime)
      ) {
        return res.status(400).json({
          success: false,
          message: "Availability slots must use HH:mm format.",
        });
      }

      updates.availableSlots = [
        ...new Set(updates.availableSlots),
      ].sort();
    }

    Object.assign(doctor, updates);
    await doctor.save();

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully.",
      doctor,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update your doctor profile.",
    });
  }
}
