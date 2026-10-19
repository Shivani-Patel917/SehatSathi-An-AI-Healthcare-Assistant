
import MedicationDose from "../models/MedicationDose.js";

const TIME_ZONE = "Asia/Kolkata";

function getLocalDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(dateString, offset) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + offset);

  return date.toISOString().slice(0, 10);
}

export async function getMedicationAdherence(req, res, next) {
  try {
    const today = getLocalDate(new Date());
    const startDate = shiftDate(today, -6);

    const doses = await MedicationDose.find({
      user: req.user._id,
      scheduledDate: {
        $gte: startDate,
        $lte: today,
      },
    })
      .select("scheduledDate status")
      .lean();

    const dailyStats = [];

    for (let offset = -6; offset <= 0; offset += 1) {
      const date = shiftDate(today, offset);

      const dayDoses = doses.filter(
        (dose) => dose.scheduledDate === date
      );

      const taken = dayDoses.filter(
        (dose) => dose.status === "taken"
      ).length;

      const skipped = dayDoses.filter(
        (dose) => dose.status === "skipped"
      ).length;

      const pending = dayDoses.filter(
        (dose) => dose.status === "pending"
      ).length;

      // Pending doses are excluded from the adherence denominator.
      const completedDecisions = taken + skipped;

      dailyStats.push({
        date,
        scheduled: dayDoses.length,
        taken,
        skipped,
        pending,
        adherence:
          completedDecisions > 0
            ? Math.round((taken / completedDecisions) * 100)
            : 0,
      });
    }

    const totals = dailyStats.reduce(
      (result, day) => ({
        scheduled: result.scheduled + day.scheduled,
        taken: result.taken + day.taken,
        skipped: result.skipped + day.skipped,
        pending: result.pending + day.pending,
      }),
      { scheduled: 0, taken: 0, skipped: 0, pending: 0 }
    );

    const decided = totals.taken + totals.skipped;

    return res.status(200).json({
      success: true,
      period: {
        startDate,
        endDate: today,
      },
      totals: {
        ...totals,
        adherence:
          decided > 0
            ? Math.round((totals.taken / decided) * 100)
            : 0,
      },
      dailyStats,
    });
  } catch (error) {
    return next(error);
  }
}
