
import cron from "node-cron";

import Medication from "../models/Medication.js";
import MedicationDose from "../models/MedicationDose.js";
import Appointment from "../models/Appointment.js";

import { createNotification } from "../services/notificationService.js";

const TIME_ZONE = "Asia/Kolkata";

function getLocalParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

function getTodayAndTime() {
  const parts = getLocalParts();

  return {
    today: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function minutesBetween(timeA, timeB) {
  const [hourA, minuteA] = timeA.split(":").map(Number);
  const [hourB, minuteB] = timeB.split(":").map(Number);

  return (
    hourB * 60 +
    minuteB -
    (hourA * 60 + minuteA)
  );
}

/**
 * Find or create a persistent dose record.
 *
 * Existing dose status is preserved. Concurrent creation attempts
 * are handled using the unique medication/date/time index.
 */
async function findOrCreateDose(medication, today, time) {
  const filter = {
    medication: medication._id,
    scheduledDate: today,
    scheduledTime: time,
  };

  try {
    return await MedicationDose.findOneAndUpdate(
      filter,
      {
        $setOnInsert: {
          user: medication.user,
          medication: medication._id,
          scheduledDate: today,
          scheduledTime: time,
          status: "pending",
          takenAt: null,
          notes: "",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );
  } catch (error) {
    // Another request may have created this dose simultaneously.
    if (error.code === 11000) {
      return MedicationDose.findOne(filter);
    }

    throw error;
  }
}

/**
 * Check medication reminders scheduled for the current minute.
 */
async function checkMedicationReminders(today, time) {
  const medications = await Medication.find({
    isActive: true,
    startDate: { $lte: today },
    $or: [
      { endDate: "" },
      { endDate: { $exists: false } },
      { endDate: { $gte: today } },
    ],
    reminderTimes: time,
    frequency: { $ne: "As needed" },
  })
    .select("_id user name frequency")
    .lean();

  for (const medication of medications) {
    try {
      const dose = await findOrCreateDose(
        medication,
        today,
        time
      );

      if (!dose) {
        console.error(
          `Could not retrieve dose for medication ${medication._id}`
        );
        continue;
      }

      // Do not remind users about doses already completed or skipped.
      if (dose.status !== "pending") {
        continue;
      }

      await createNotification({
        user: medication.user,
        type: "medication-reminder",
        title: "Medication reminder",
        message: `It's a scheduled reminder for ${medication.name}. Check your own medication instructions.`,
        link: "/user/medicine-reminders",
        dedupeKey: `medication:${medication._id}:${today}:${time}`,
      });
    } catch (error) {
      console.error(
        `Medication reminder failed for ${medication._id}:`,
        error
      );
    }
  }
}

/**
 * Send appointment reminders approximately 30 minutes before
 * the appointment time.
 */
async function checkAppointmentReminders(today, time) {
  const appointments = await Appointment.find({
    appointmentDate: today,
    status: { $in: ["pending", "confirmed"] },
  })
    .populate("doctor", "name")
    .select(
      "_id patient doctor appointmentDate appointmentTime status"
    )
    .lean();

  for (const appointment of appointments) {
    try {
      if (!appointment.doctor) {
        continue;
      }

      if (
        minutesBetween(time, appointment.appointmentTime) !== 30
      ) {
        continue;
      }

      await createNotification({
        user: appointment.patient,
        type: "appointment-reminder",
        title: "Upcoming appointment",
        message: `Your appointment with ${appointment.doctor.name} is scheduled in about 30 minutes.`,
        link: "/user/appointments",
        dedupeKey: `appointment:${appointment._id}:30min`,
      });
    } catch (error) {
      console.error(
        `Appointment reminder failed for ${appointment._id}:`,
        error
      );
    }
  }
}

/**
 * Run medication and appointment reminder checks.
 */
async function runReminderChecks() {
  const { today, time } = getTodayAndTime();

  const results = await Promise.allSettled([
    checkMedicationReminders(today, time),
    checkAppointmentReminders(today, time),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        "A reminder check failed:",
        result.reason
      );
    }
  }
}

let schedulerStarted = false;

/**
 * Start the reminder scheduler once per Node.js process.
 */
export function startNotificationScheduler() {
  if (schedulerStarted) {
    console.log("Notification scheduler is already running.");
    return;
  }

  schedulerStarted = true;

  // Perform an initial check after the database connects.
  runReminderChecks().catch((error) => {
    console.error(
      "Initial notification check failed:",
      error
    );
  });

  cron.schedule(
    "* * * * *",
    () => {
      runReminderChecks().catch((error) => {
        console.error(
          "Notification scheduler failed:",
          error
        );
      });
    },
    { timezone: TIME_ZONE }
  );

  console.log(
    `Notification scheduler started (${TIME_ZONE}).`
  );
}
