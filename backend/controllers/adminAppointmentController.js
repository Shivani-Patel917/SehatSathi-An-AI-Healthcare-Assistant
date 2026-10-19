import { createNotification } from "../services/notificationService.js";
import Appointment from "../models/Appointment.js";

const validStatuses = ["pending", "confirmed", "completed", "cancelled"];

const allowedTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function getAllAppointments(req, res) {
  try {
    const filter = {};

    if (req.query.status) {
      if (!validStatuses.includes(req.query.status)) {
        return res.status(400).json({
          message: "Invalid appointment status.",
        });
      }

      filter.status = req.query.status;
    }

    const appointments = await Appointment.find(filter)
      .populate("patient", "name email")
      .populate(
        "doctor",
        "name specialty consultationFee isActive"
      )
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(200);

    return res.json({ success: true, appointments });
  } catch (error) {
    console.error("Get appointments error:", error);
    return res.status(500).json({
      message: "Unable to load appointments.",
    });
  }
}

export async function updateAppointmentStatus(req, res) {
  try {
    const { status } = req.body;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Provide a valid appointment status.",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (!allowedTransitions[appointment.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot change appointment from ${appointment.status} to ${status}.`,
      });
    }

    appointment.status = status;
    await appointment.save();

    await appointment.populate("patient", "name email");
    await appointment.populate(
      "doctor",
      "name specialty consultationFee isActive"
    );

    return res.json({
      success: true,
      message: `Appointment ${status} successfully.`,
      appointment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment ID." });
    }

    console.error("Update appointment status error:", error);
    return res.status(500).json({
      message: "Unable to update appointment status.",
    });
  }
}
