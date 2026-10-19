
import mongoose from "mongoose";
import HealthMetric from "../models/HealthMetric.js";

const allowedTypes = [
  "weight",
  "blood-pressure",
  "blood-glucose",
];

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T12:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function isPositiveNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

// GET /api/health-tracker
export async function getHealthMetrics(req, res) {
  try {
    const filter = { user: req.user._id };

    if (req.query.type) {
      if (!allowedTypes.includes(req.query.type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid measurement type.",
        });
      }

      filter.type = req.query.type;
    }

    const metrics = await HealthMetric.find(filter)
      .sort({ recordedAt: -1, createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error("Get health metrics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load health measurements.",
    });
  }
}

// POST /api/health-tracker
export async function createHealthMetric(req, res) {
  try {
    const {
      type,
      value,
      systolic,
      diastolic,
      recordedAt,
      notes = "",
    } = req.body;

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid measurement type.",
      });
    }

    if (!isValidDate(recordedAt)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid measurement date.",
      });
    }

    if (typeof notes !== "string" || notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Notes must be 500 characters or fewer.",
      });
    }

    const measurementDate = new Date(`${recordedAt}T12:00:00.000Z`);

    if (measurementDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: "The measurement date cannot be in the future.",
      });
    }

    let metricData;

    if (type === "weight") {
      if (!isPositiveNumber(value) || value > 500) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid weight in kilograms.",
        });
      }

      metricData = { type, value, unit: "kg" };
    } else if (type === "blood-glucose") {
      if (!isPositiveNumber(value) || value > 2000) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid blood glucose value in mg/dL.",
        });
      }

      metricData = { type, value, unit: "mg/dL" };
    } else {
      if (
        !Number.isInteger(systolic) ||
        !Number.isInteger(diastolic) ||
        systolic < 1 ||
        systolic > 350 ||
        diastolic < 1 ||
        diastolic > 250
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter valid systolic and diastolic values.",
        });
      }

      metricData = {
        type,
        systolic,
        diastolic,
        unit: "mmHg",
      };
    }

    const metric = await HealthMetric.create({
      ...metricData,
      user: req.user._id,
      recordedAt: measurementDate,
      notes: notes.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Health measurement saved successfully.",
      metric,
    });
  } catch (error) {
    console.error("Create health metric error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save the health measurement.",
    });
  }
}

// DELETE /api/health-tracker/:id
export async function deleteHealthMetric(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid measurement ID.",
      });
    }

    const metric = await HealthMetric.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!metric) {
      return res.status(404).json({
        success: false,
        message: "Measurement not found.",
      });
    }

    return res.json({
      success: true,
      message: "Measurement deleted successfully.",
    });
  } catch (error) {
    console.error("Delete health metric error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete the measurement.",
    });
  }
}
