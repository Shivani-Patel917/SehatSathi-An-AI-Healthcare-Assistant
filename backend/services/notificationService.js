import Notification from "../models/Notification.js";

export async function createNotification({
  user,
  type,
  title,
  message,
  link = "",
  dedupeKey = null,
}) {
  const payload = {
    user,
    type,
    title,
    message,
    link,
    dedupeKey,
  };

  if (dedupeKey) {
    try {
      return await Notification.findOneAndUpdate(
        { user, dedupeKey },
        { $setOnInsert: payload },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      // Another scheduler run may have inserted the same key concurrently.
      if (error.code === 11000) {
        return Notification.findOne({ user, dedupeKey });
      }
      throw error;
    }
  }

  return Notification.create(payload);
}