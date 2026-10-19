
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import MedicalRecord from "../models/MedicalRecord.js";
import { uploadDirectory } from "../middleware/uploadMedicalReport.js";

const getUserId = (req) => req.user?._id || req.user?.id;

const allowedTypes = [
  "Blood Test",
  "Prescription",
  "Medical Report",
  "X-Ray",
  "MRI",
  "CT Scan",
  "Discharge Summary",
  "Vaccination",
  "Other",
];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeRecord = (record) => {
  const item = { ...record };

  const hasFile = Boolean(
    item.originalName && item.storedName && item.storagePath
  );

  return {
    ...item,
    id: String(item._id),
    fileName: item.originalName || "",
    category: item.recordType,
    reportDate: item.recordDate,
    hasFile,
    fileUrl: hasFile
      ? `/medical-records/${item._id}/download`
      : null,
    downloadUrl: hasFile
      ? `/medical-records/${item._id}/download`
      : null,
  };
};

// GET /api/medical-records
export const getMyMedicalRecords = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const records = await MedicalRecord.find({ user: userId })
      .select("+storedName +storagePath")
      .sort({ recordDate: -1, createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      records: records.map(serializeRecord),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/medical-records
export const createMedicalRecord = async (req, res, next) => {
  let uploadedPath;

  try {
    const userId = getUserId(req);

    if (!userId) {
      if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
      return res.status(401).json({ message: "Please log in again." });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a report file to upload.",
      });
    }

    uploadedPath = path.resolve(req.file.path);

    const { title, recordType, recordDate, provider, notes } = req.body;

    if (!title?.trim()) {
      await fs.unlink(uploadedPath).catch(() => {});
      return res.status(400).json({ message: "Report title is required." });
    }

    const chosenType = recordType || "Medical Report";

    if (!allowedTypes.includes(chosenType)) {
      await fs.unlink(uploadedPath).catch(() => {});
      return res.status(400).json({ message: "Invalid report type." });
    }

    const parsedDate = recordDate ? new Date(recordDate) : new Date();

    if (Number.isNaN(parsedDate.getTime())) {
      await fs.unlink(uploadedPath).catch(() => {});
      return res.status(400).json({ message: "Invalid report date." });
    }

    const record = await MedicalRecord.create({
      user: userId,
      title: title.trim(),
      recordType: chosenType,
      recordDate: parsedDate,
      provider: provider?.trim() || "",
      notes: notes?.trim() || "",
      originalName: path.basename(req.file.originalname),
      storedName: req.file.filename,
      storagePath: uploadedPath,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    const savedRecord = await MedicalRecord.findOne({
      _id: record._id,
      user: userId,
    })
      .select("+storedName +storagePath")
      .lean();

    return res.status(201).json({
      message: "Medical report uploaded successfully.",
      record: serializeRecord(savedRecord),
    });
  } catch (error) {
    if (uploadedPath) {
      await fs.unlink(uploadedPath).catch(() => {});
    }
    next(error);
  }
};

// GET /api/medical-records/:id/download
export const downloadMedicalRecord = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Please log in again." });
    }

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid report ID." });
    }

    const record = await MedicalRecord.findOne({
      _id: id,
      user: userId,
    }).select("+storedName +storagePath");

    if (!record) {
      return res.status(404).json({ message: "Medical report not found." });
    }

    if (!record.storedName || !record.storagePath) {
      return res.status(404).json({
        message: "This older record has no attached file. Please upload the report again.",
      });
    }

    // Restrict file access to the configured private upload directory.
    const resolvedPath = path.resolve(record.storagePath);
    const relativePath = path.relative(uploadDirectory, resolvedPath);

    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      return res.status(403).json({ message: "Invalid report file path." });
    }

    await fs.access(resolvedPath);

    return res.download(
      resolvedPath,
      path.basename(record.originalName || record.storedName),
      (error) => {
        if (error && !res.headersSent) next(error);
      }
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        message: "The report file is missing from server storage. Please upload it again.",
      });
    }
    next(error);
  }
};

// PATCH /api/medical-records/:id
export const updateMedicalRecord = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid report ID." });
    }

    const record = await MedicalRecord.findOne({ _id: id, user: userId });

    if (!record) {
      return res.status(404).json({ message: "Medical report not found." });
    }

    const { title, recordType, recordDate, provider, notes } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: "Report title is required." });
      }
      record.title = title.trim();
    }

    if (recordType !== undefined) {
      if (!allowedTypes.includes(recordType)) {
        return res.status(400).json({ message: "Invalid report type." });
      }
      record.recordType = recordType;
    }

    if (recordDate !== undefined) {
      const parsedDate = new Date(recordDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid report date." });
      }
      record.recordDate = parsedDate;
    }

    if (provider !== undefined) record.provider = provider.trim();
    if (notes !== undefined) record.notes = notes.trim();

    await record.save();

    const updatedRecord = await MedicalRecord.findOne({
      _id: record._id,
      user: userId,
    })
      .select("+storedName +storagePath")
      .lean();

    return res.status(200).json({
      message: "Medical report updated successfully.",
      record: serializeRecord(updatedRecord),
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/medical-records/:id
export const deleteMedicalRecord = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid report ID." });
    }

    const record = await MedicalRecord.findOne({
      _id: id,
      user: userId,
    }).select("+storedName +storagePath");

    if (!record) {
      return res.status(404).json({ message: "Medical report not found." });
    }

    await record.deleteOne();

    if (record.storagePath) {
      const resolvedPath = path.resolve(record.storagePath);
      const relativePath = path.relative(uploadDirectory, resolvedPath);

      if (
        relativePath &&
        !relativePath.startsWith("..") &&
        !path.isAbsolute(relativePath)
      ) {
        await fs.unlink(resolvedPath).catch((error) => {
          if (error.code !== "ENOENT") {
            console.error("Could not remove report file:", error.message);
          }
        });
      }
    }

    return res.status(200).json({
      message: "Medical report deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
