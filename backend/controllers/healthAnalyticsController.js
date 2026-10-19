
import Appointment from "../models/Appointment.js";
import MedicalRecord from "../models/MedicalRecord.js";
import Medication from "../models/Medication.js";

export async function getHealthAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Use local calendar dates for the appointment date fields.
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const currentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    const [
      appointmentCounts,
      upcomingAppointments,
      monthlyAppointments,
      medicalRecordCount,
      activeMedicationCount,
      activeMedications,
      profile,
    ] = await Promise.all([
      Appointment.aggregate([
        { $match: { patient: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Appointment.find({
        patient: userId,
        appointmentDate: { $gte: today },
        status: { $in: ["pending", "confirmed"] },
      })
        .populate("doctor", "name specialty")
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .limit(5)
        .lean(),

      Appointment.aggregate([
        {
          $match: {
            patient: userId,
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
              $lt: nextMonth,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Assumes MedicalRecord stores its owner in a "user" field.
      MedicalRecord.countDocuments({ user: userId }),

      Medication.countDocuments({
        user: userId,
        isActive: true,
        startDate: { $lte: today },
        $or: [
          { endDate: "" },
          { endDate: { $exists: false } },
          { endDate: { $gte: today } },
        ],
      }),

      Medication.find({
        user: userId,
        isActive: true,
        startDate: { $lte: today },
        $or: [
          { endDate: "" },
          { endDate: { $exists: false } },
          { endDate: { $gte: today } },
        ],
      })
        .select("name dosage frequency reminderTimes")
        .limit(10)
        .lean(),

      // Keep this query aligned with the fields in your User model.
      // It deliberately selects only basic profile information.
      req.user.constructor
        .findById(userId)
        .select("name email")
        .lean(),
    ]);

    const appointments = {
      total: appointmentCounts.reduce(
        (sum, item) => sum + item.count,
        0
      ),
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const item of appointmentCounts) {
      if (Object.hasOwn(appointments, item._id)) {
        appointments[item._id] = item.count;
      }
    }

    const monthLabels = [];
    const monthCounts = [];

    for (let offset = 5; offset >= 0; offset--) {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      );

      const key = {
        year: monthDate.getFullYear(),
        month: monthDate.getMonth() + 1,
      };

      const found = monthlyAppointments.find(
        (item) =>
          item._id.year === key.year &&
          item._id.month === key.month
      );

      monthLabels.push(
        monthDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        })
      );

      monthCounts.push(found?.count ?? 0);
    }

    const reminders = [];

    if (upcomingAppointments.length > 0) {
      reminders.push({
        type: "appointment",
        message: `You have ${upcomingAppointments.length} upcoming appointment(s).`,
        link: "/user/appointments",
      });
    }

    if (activeMedicationCount > 0) {
      reminders.push({
        type: "medication",
        message: `You have ${activeMedicationCount} active medication schedule(s).`,
        link: "/user/medicine-reminders",
      });
    }

    return res.status(200).json({
      success: true,
      analytics: {
        user: {
          name: profile?.name ?? "User",
        },
        appointments,
        medicalRecords: medicalRecordCount,
        activeMedications: activeMedicationCount,
        medicationList: activeMedications,
        upcomingAppointments,
        monthlyTrend: monthLabels.map((month, index) => ({
          month,
          appointments: monthCounts[index],
        })),
        reminders,
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Health analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load health analytics.",
    });
  }
}