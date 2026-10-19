
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import AIActivity from "../models/AIActivity.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const getRangeStart = (range = "30d") => {
  const now = new Date();
  const start = new Date(now);

  if (range === "7d") {
    start.setUTCDate(start.getUTCDate() - 6);
  } else if (range === "90d") {
    start.setUTCDate(start.getUTCDate() - 89);
  } else if (range === "12m") {
    start.setUTCFullYear(start.getUTCFullYear() - 1);
  } else {
    start.setUTCDate(start.getUTCDate() - 29);
  }

  start.setUTCHours(0, 0, 0, 0);

  const days =
    Math.floor(
      (
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        ) -
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate()
        )
      ) / DAY_MS
    ) + 1;

  return { start, days };
};

const getDailyCounts = async (Model, start, filter = {}) => {
  return Model.aggregate([
    {
      $match: {
        ...filter,
        createdAt: { $gte: start },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "UTC",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const fillMissingDates = (rows, start, days) => {
  const counts = new Map(
    rows.map((row) => [row._id, row.count])
  );

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);

    const key = date.toISOString().slice(0, 10);

    return {
      date: key,
      count: counts.get(key) || 0,
    };
  });
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const { start, days } = getRangeStart(req.query.range);

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsers,
      totalAppointments,
      appointmentsInPeriod,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      confirmedAppointments,
      registrationRows,
      appointmentRows,
      aiRequests,
      aiErrors,
      aiRows,
    ] = await Promise.all([
      // Regular registered accounts.
      User.countDocuments({ role: "user" }),

      User.countDocuments({
        role: "user",
        createdAt: { $gte: start },
      }),

      Appointment.countDocuments(),

      Appointment.countDocuments({
        createdAt: { $gte: start },
      }),

      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "pending" }),
      Appointment.countDocuments({ status: "cancelled" }),
      Appointment.countDocuments({ status: "confirmed" }),

      getDailyCounts(User, start, { role: "user" }),
      getDailyCounts(Appointment, start),

      AIActivity.countDocuments({
        createdAt: { $gte: start },
      }),

      AIActivity.countDocuments({
        createdAt: { $gte: start },
        status: "failed",
      }),

      AIActivity.aggregate([
        {
          $match: {
            createdAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "UTC",
                },
              },
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
    ]);

    const registrations = fillMissingDates(
      registrationRows,
      start,
      days
    );

    const appointments = fillMissingDates(
      appointmentRows,
      start,
      days
    );

    const aiByDate = new Map();

    for (const row of aiRows) {
      const date = row._id.date;

      if (!aiByDate.has(date)) {
        aiByDate.set(date, {
          date,
          requests: 0,
          errors: 0,
        });
      }

      const item = aiByDate.get(date);
      item.requests += row.count;

      if (row._id.status === "failed") {
        item.errors += row.count;
      }
    }

    const aiActivity = Array.from(
      { length: days },
      (_, index) => {
        const date = new Date(start);
        date.setUTCDate(date.getUTCDate() + index);

        const key = date.toISOString().slice(0, 10);

        return (
          aiByDate.get(key) || {
            date: key,
            requests: 0,
            errors: 0,
          }
        );
      }
    );

    return res.status(200).json({
      success: true,
      analytics: {
        stats: {
          totalUsers,
          newUsers,
          totalAppointments: appointmentsInPeriod,
          completedAppointments,
          pendingAppointments,
          aiRequests,
          aiErrors,
        },

        registrations,
        appointments,

        appointmentBreakdown: [
          { name: "Pending", value: pendingAppointments },
          { name: "Confirmed", value: confirmedAppointments },
          { name: "Completed", value: completedAppointments },
          { name: "Cancelled", value: cancelledAppointments },
        ],

        aiActivity,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load analytics.",
    });
  }
};
