import api from "./api.js";

export const reportService = {
  mine: () => api.get("/reports/me"),
  upload: (formData) =>
    api.post("/reports", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  // admin
  all: (params) => api.get("/reports", { params }),
  review: (id, data) => api.patch(`/reports/${id}`, data),
};
