
import { protect } from "./authMiddleware.js";

export { protect };

export function requireDoctor(req, res, next) {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({
      success: false,
      message: "Doctor access is required.",
    });
  }

  next();
}
