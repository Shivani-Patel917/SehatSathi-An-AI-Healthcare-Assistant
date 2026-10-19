import mongoose from "mongoose";
import { createNotification } from "../services/notificationService.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

function isRealDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekday(date) {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
}

// POST /api/appointments
export async function bookAppointment(req, res) {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    if (
      typeof doctorId !== "string" ||
      !/^[a-f\d]{24}$/i.test(doctorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid doctor.",
      });
    }

    if (!isRealDate(appointmentDate)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid appointment date.",
      });
    }

    if (appointmentDate < getLocalDateString()) {
      return res.status(400).json({
        success: false,
        message: "Appointment date cannot be in the past.",
      });
    }

    if (
      typeof appointmentTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(appointmentTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid appointment time.",
      });
    }

    if (
      typeof reason !== "string" ||
      reason.trim().length < 3 ||
      reason.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason must contain 3–500 characters.",
      });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      isActive: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const weekday = getWeekday(appointmentDate);

    if (!doctor.availableDays.includes(weekday)) {
      return res.status(400).json({
        success: false,
        message: "This doctor is not available on the selected day.",
      });
    }

    if (!doctor.availableSlots.includes(appointmentTime)) {
      return res.status(400).json({
        success: false,
        message: "This time slot is not available for the selected doctor.",
      });
    }

    const now = new Date();

    if (appointmentDate === getLocalDateString(now)) {
      const [hours, minutes] = appointmentTime.split(":").map(Number);
      const selected = new Date(now);

      selected.setHours(hours, minutes, 0, 0);

      if (selected <= now) {
        return res.status(400).json({
          success: false,
          message: "Select a future time.",
        });
      }
    }

    const existing = await Appointment.findOne({
      doctor: doctor._id,
      appointmentDate,
      appointmentTime,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This time slot has already been booked.",
      });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      appointmentDate,
      appointmentTime,
      reason: reason.trim(),
    });

    await appointment.populate(
      "doctor",
      "name specialty qualifications consultationFee"
    );

    // A notification failure must not undo a saved appointment.
    try {
      await createNotification({
        user: req.user._id,
        type: "appointment",
        title: "Appointment requested",
        message: "Your appointment request has been submitted successfully.",
        link: "/user/appointments",
      });
    } catch (notificationError) {
      console.error(
        "Appointment notification error:",
        notificationError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Appointment request submitted successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Book appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to book appointment.",
    });
  }
}

// GET /api/appointments/my
export async function getMyAppointments(req, res) {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,
    })
      .populate("doctor", "name specialty qualifications consultationFee")
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(100)
      .lean();

    return res.json({ success: true, appointments });
  } catch (error) {
    console.error("Get appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load appointments.",
    });
  }
}


// GET /api/appointments/:id
export async function getAppointmentById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patient: req.user._id,
    })
      .populate(
        "doctor",
        "name specialty qualifications consultationFee"
      )
      .lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Get appointment details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load appointment details.",
    });
  }
}
// PATCH /api/appointments/:id/cancel
export async function cancelAppointment(req, res) {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "This appointment cannot be cancelled.",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    return res.json({
      success: true,
      message: "Appointment cancelled successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel appointment.",
    });
  }
}
