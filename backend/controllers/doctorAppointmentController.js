
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import { createNotification } from "../services/notificationService.js";

async function getLinkedDoctor(userId) {
  return Doctor.findOne({
    user: userId,
    isActive: true,
  });
}

// GET /api/doctor/appointments
export async function getDoctorAppointments(req, res) {
  try {
    const doctor = await getLinkedDoctor(req.user._id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "No active doctor profile is linked to this account.",
      });
    }

    const filter = { doctor: doctor._id };

    if (req.query.status) {
      const allowedStatuses = [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment status.",
        });
      }

      filter.status = req.query.status;
    }

    if (req.query.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment date.",
        });
      }

      const date = new Date(`${req.query.date}T12:00:00.000Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== req.query.date
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment date.",
        });
      }

      filter.appointmentDate = req.query.date;
    }

    const appointments = await Appointment.find(filter)
      .populate("patient", "name email")
      .populate("doctor", "name specialty")
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Get doctor appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load doctor appointments.",
    });
  }
}

// PATCH /api/doctor/appointments/:id/status
export async function updateDoctorAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const allowedStatuses = ["confirmed", "cancelled", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment status.",
      });
    }

    const doctor = await getLinkedDoctor(req.user._id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "No active doctor profile is linked to this account.",
      });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    // Permit only legitimate status transitions.
    const transitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!transitions[appointment.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change appointment from ${appointment.status} to ${status}.`,
      });
    }

    appointment.status = status;
    await appointment.save();

    // Notification failure must not undo a saved status change.
    try {
      await createNotification({
        user: appointment.patient,
        type: "appointment",
        title: "Appointment status updated",
        message: `Your appointment status is now ${status}.`,
        link: "/user/appointments",
      });
    } catch (notificationError) {
      console.error(
        "Doctor appointment notification error:",
        notificationError
      );
    }

    await appointment.populate("patient", "name email");
    await appointment.populate("doctor", "name specialty");

    return res.json({
      success: true,
      message: "Appointment status updated successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Update doctor appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update appointment status.",
    });
  }
}
