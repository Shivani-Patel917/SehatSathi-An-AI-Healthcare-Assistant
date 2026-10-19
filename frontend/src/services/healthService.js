import api from "./api.js";

export const healthService = {
  // doctors & articles
  listDoctors: (params) => api.get("/doctors", { params }),
  getDoctor: (id) => api.get(`/doctors/${id}`),
  listArticles: (params) => api.get("/articles", { params }),
  getArticle: (id) => api.get(`/articles/${id}`),
  // AI assistant
  askAssistant: (message) => api.post("/assistant/chat", { message }),
  // tracker & reminders
  getMetrics: () => api.get("/tracker"),
  addMetric: (data) => api.post("/tracker", data),
  listReminders: () => api.get("/reminders"),
  addReminder: (data) => api.post("/reminders", data),
};
