
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadDirectory = path.resolve(
  __dirname,
  "../private-uploads/medical-reports"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();
  const validExtensions = allowedTypes[file.mimetype] || [];

  if (!validExtensions.includes(extension)) {
    const error = new Error(
      "Only PDF, JPG, JPEG, PNG, and WEBP files are allowed."
    );
    error.statusCode = 400;
    return callback(error);
  }

  callback(null, true);
}

const uploadMedicalReport = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

export default uploadMedicalReport;
