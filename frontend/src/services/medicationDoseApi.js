
import api from "./api";

const medicationDoseApi = {
  generateDailyDoses(date) {
    return api.post("/medication-doses/generate", null, {
      params: date ? { date } : {},
    });
  },

  getDailyDoses(date) {
    return api.get("/medication-doses", {
      params: date ? { date } : {},
    });
  },

  updateDoseStatus(id, status, notes) {
    return api.patch(`/medication-doses/${id}`, {
      status,
      ...(notes !== undefined ? { notes } : {}),
    });
  },
};

export default medicationDoseApi;
