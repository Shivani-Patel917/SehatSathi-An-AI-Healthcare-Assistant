
export const medicalRecordCategories = [
  { label: "Consultation", value: "consultation" },
  { label: "Blood Test / Lab Report", value: "lab-report" },
  { label: "Prescription", value: "prescription" },
  { label: "Allergy", value: "allergy" },
  { label: "Diagnosis", value: "diagnosis" },
  { label: "Vaccination", value: "vaccination" },
  { label: "Other", value: "other" },
];

export function getMedicalRecordCategory(value) {
  return (
    medicalRecordCategories.find((category) => category.value === value)
      ?.label || "Other"
  );
}

export function formatMedicalRecordDate(value) {
  if (!value) return "Date not available";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatFileSize(bytes = 0) {
  if (!bytes) return "Unknown size";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
