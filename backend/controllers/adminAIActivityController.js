import AIActivity from "../models/AIActivity.js";

const allowedRanges = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const getAdminAIActivity = async (req, res) => {
  try {
    const days = allowedRanges[req.query.range] || 30;
    const start = new Date();

    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const [
      totalRequests,
      successfulRequests,
      failedRequests,
      recentActivities,
      dailyActivity,
    ] = await Promise.all([
      AIActivity.countDocuments({ createdAt: { $gte: start } }),
      AIActivity.countDocuments({
        createdAt: { $gte: start },
        status: "success",
      }),
      AIActivity.countDocuments({
        createdAt: { $gte: start },
        status: "failed",
      }),
      AIActivity.find({ createdAt: { $gte: start } })
        .select("-errorMessage")
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      AIActivity.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            requests: { $sum: 1 },
            errors: {
              $sum: {
                $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const averageDuration = await AIActivity.aggregate([
      {
        $match: {
          createdAt: { $gte: start },
          status: "success",
          durationMs: { $ne: null, $gte: 0 },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$durationMs" },
        },
      },
    ]);

    res.json({
      success: true,
      activity: {
        stats: {
          totalRequests,
          successfulRequests,
          failedRequests,
          successRate: totalRequests
            ? Number(((successfulRequests / totalRequests) * 100).toFixed(1))
            : 0,
          averageDurationMs: averageDuration[0]?.average
            ? Math.round(averageDuration[0].average)
            : null,
        },
        dailyActivity: dailyActivity.map((item) => ({
          date: item._id,
          requests: item.requests,
          errors: item.errors,
        })),
        recentActivities: recentActivities.map((item) => ({
          id: item._id,
          user: item.user
            ? { name: item.user.name, email: item.user.email }
            : null,
          action: item.action,
          status: item.status,
          provider: item.provider,
          model: item.model,
          durationMs: item.durationMs,
          errorMessage: item.status === "failed"
            ? "Request failed; inspect server logs for details."
            : null,
          createdAt: item.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Admin AI activity error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to load AI activity.",
    });
  }
};