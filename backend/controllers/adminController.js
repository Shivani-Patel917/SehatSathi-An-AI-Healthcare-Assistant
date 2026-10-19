
import User from "../models/User.js";

// GET /api/admin/users
export async function getAllUsers(req, res) {
  try {
    const users = await User.find({})
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("getAllUsers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
}
