
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Pill,
  CalendarDays,
  Trash2,
  RefreshCw,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    "Something went wrong. Please try again."
  );
}

function getNotificationIcon(type) {
  if (type === "medication-reminder") return Pill;
  if (type === "appointment-reminder") return CalendarDays;
  return Bell;
}

function formatNotificationDate(date) {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications?limit=50");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data?.notifications ?? data?.data ?? [];

      const safeList = Array.isArray(list) ? list : [];

      setNotifications(safeList);

      setUnreadCount(
        Number.isFinite(data?.unreadCount)
          ? data.unreadCount
          : safeList.filter((item) => !item.isRead).length
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notification) => {
    if (notification.isRead) return;

    setBusyId(notification._id);

    try {
      await api.patch(`/notifications/${notification._id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);

    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (notification) => {
    setBusyId(notification._id);

    try {
      await api.delete(`/notifications/${notification._id}`);

      setNotifications((current) =>
        current.filter((item) => item._id !== notification._id)
      );

      if (!notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      toast.success("Notification deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const openNotification = async (notification) => {
    await markAsRead(notification);

    if (notification.link?.startsWith("/")) {
      navigate(notification.link);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-teal-700">
              <Bell size={20} />
              <span className="text-sm font-semibold">
                SehatSathi Notifications
              </span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Medication reminders and important updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              disabled={unreadCount === 0 || markingAll}
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck size={16} />
              {markingAll ? "Updating..." : "Read all"}
            </button>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total notifications
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Unread</p>
            <p className="mt-1 text-2xl font-bold text-teal-700">
              {unreadCount}
            </p>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <RefreshCw
              className="mx-auto mb-3 animate-spin text-teal-600"
              size={28}
            />
            <p className="text-slate-600">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Inbox size={36} />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              You're all caught up
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              New reminders and updates will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/user/medications")}
              className="mt-5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              View medications
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const busy = busyId === notification._id;

              return (
                <article
                  key={notification._id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                    notification.isRead
                      ? "border-slate-200"
                      : "border-teal-200 ring-1 ring-teal-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`shrink-0 rounded-xl p-3 ${
                        notification.isRead
                          ? "bg-slate-100 text-slate-600"
                          : "bg-teal-50 text-teal-700"
                      }`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words font-semibold text-slate-900">
                          {notification.title}
                        </h2>

                        {!notification.isRead && (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>

                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={13} />
                        {formatNotificationDate(notification.createdAt)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {notification.link && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openNotification(notification)}
                            className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Open
                          </button>
                        )}

                        {!notification.isRead && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => markAsRead(notification)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check size={15} />
                            Mark as read
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteNotification(notification)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
