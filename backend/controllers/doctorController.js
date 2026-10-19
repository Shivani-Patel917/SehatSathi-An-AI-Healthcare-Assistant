
import Doctor from "../models/Doctor.js";

// GET /api/doctors
export async function getDoctors(req, res) {
  try {
    const { search = "", specialty = "" } = req.query;

    const filter = { isActive: true };

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { specialty: { $regex: search.trim(), $options: "i" } },
        { qualifications: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (specialty.trim()) {
      filter.specialty = { $regex: `^${specialty.trim()}$`, $options: "i" };
    }

    const doctors = await Doctor.find(filter)
      .select(
        "name specialty qualifications experienceYears consultationFee about availableDays availableSlots isActive"
      )
      .sort({ name: 1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Get doctors error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load doctors.",
    });
  }
}

// GET /api/doctors/:id
export async function getDoctorById(req, res) {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .select(
        "name specialty qualifications experienceYears consultationFee about availableDays availableSlots isActive"
      )
      .lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or no longer available.",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    console.error("Get doctor details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load doctor details.",
    });
  }
}
