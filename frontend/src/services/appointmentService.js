import api from "./api.js";

export const appointmentService = {
  mine: () => api.get("/appointments/me"),
  get: (id) => api.get(`/appointments/${id}`),
  book: (data) => api.post("/appointments", data),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
  // admin
  all: (params) => api.get("/appointments", { params }),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
};
