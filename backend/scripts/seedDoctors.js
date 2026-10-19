
import "dotenv/config";
import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";

const doctors = [
  {
    name: "Dr. Priya Sharma",
    specialty: "General Physician",
    qualifications: "MBBS, MD General Medicine",
    experienceYears: 8,
    consultationFee: 500,
    about: "Provides general consultations and preventive health guidance.",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    availableSlots: ["09:00", "10:00", "11:00", "14:00", "15:00"],
  },
  {
    name: "Dr. Rahul Verma",
    specialty: "Cardiology",
    qualifications: "MBBS, MD, DM Cardiology",
    experienceYears: 12,
    consultationFee: 800,
    about: "Focuses on cardiovascular consultations and heart health.",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    availableSlots: ["10:00", "11:00", "12:00", "14:00", "16:00"],
  },
  {
    name: "Dr. Ananya Singh",
    specialty: "Dermatology",
    qualifications: "MBBS, MD Dermatology",
    experienceYears: 6,
    consultationFee: 600,
    about: "Provides consultations for common skin and hair concerns.",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"],
    availableSlots: ["09:00", "10:00", "12:00", "14:00", "15:00"],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Seed only if the collection is empty.
    const count = await Doctor.countDocuments();

    if (count > 0) {
      console.log("Doctors already exist. No changes made.");
      return;
    }

    await Doctor.insertMany(doctors);
    console.log("Sample doctors inserted successfully.");
  } catch (error) {
    console.error("Doctor seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
