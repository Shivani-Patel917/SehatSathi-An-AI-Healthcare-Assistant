
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import { startNotificationScheduler } from "./jobs/notificationScheduler.js";
import articleRoutes from "./routes/articleRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import medicationRoutes from "./routes/medicationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import healthAnalyticsRoutes from "./routes/healthAnalyticsRoutes.js";
import healthMetricRoutes from "./routes/healthMetricRoutes.js";
import medicationAnalyticsRoutes from "./routes/medicationAnalyticsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiChatRoutes from "./routes/aiChatRoutes.js";

import doctorAppointmentRoutes from "./routes/doctorAppointmentRoutes.js";
import adminDoctorRoutes from "./routes/adminDoctorRoutes.js";
import adminAppointmentRoutes from "./routes/adminAppointmentRoutes.js";
//import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import doctorProfileRoutes from "./routes/doctorProfileRoutes.js";
import medicationDoseRoutes from "./routes/medicationDoseRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SehatSathi API is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use("/api/articles", articleRoutes);
app.use("/api/contact", contactRoutes);
// General and user APIs
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/analytics", healthAnalyticsRoutes);
app.use("/api/health-tracker", healthMetricRoutes);
app.use("/api/medication-doses", medicationDoseRoutes);
app.use("/api/medication-analytics",medicationAnalyticsRoutes);

app.use("/api/doctor", doctorAppointmentRoutes);
app.use("/api/doctor/profile", doctorProfileRoutes);

// Admin APIs
app.use("/api/admin", adminRoutes);
app.use("/api/admin/doctors", adminDoctorRoutes);
app.use("/api/admin/appointments", adminAppointmentRoutes);
//app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/ai", aiChatRoutes);

app.use("/api/contact", contactRoutes);
app.get("/api/contact/test", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Contact routes are registered.",
  });
});

// Keep this AFTER all app.use("/api/...", routes) declarations.
app.use((err, req, res, next) => {
  console.error("Express error:", {
    method: req.method,
    url: req.originalUrl,
    name: err.name,
    message: err.message,
    status: err.status || err.statusCode,
    stack: err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  const status = Number(err.status || err.statusCode) || 500;

  return res.status(status).json({
    success: false,
    message:
      status >= 400 && status < 500
        ? err.message || "Invalid request."
        : "Internal server error.",
  });
});

// Start only after the database is connected
async function startServer() {
  try {
    await connectDB();
    console.log("MongoDB connected successfully.");

    // Start automatic appointment and medication reminders.
    startNotificationScheduler();

    app.listen(PORT, () => {
      console.log(`SehatSathi API: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();