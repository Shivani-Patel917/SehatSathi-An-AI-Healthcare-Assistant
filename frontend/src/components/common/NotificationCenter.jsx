import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  LoaderCircle,
  Pill,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

function getNotificationIcon(type) {
  if (type === "medication-reminder") return Pill;
  if (type === "appointment-reminder") return CalendarClock;
  if (type === "appointment") return ClipboardList;
  return BellRing;
}

function formatNotificationDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window
      ? window.Notification.permission
      : "unsupported"
  );

  const seenIds = useRef(new Set());
  const initialized = useRef(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications?limit=30");
      const next = response.data.notifications ?? [];

      // Don't show browser popups for old notifications on initial load.
      if (!initialized.current) {
        next.forEach((item) => seenIds.current.add(item._id));
        initialized.current = true;
      } else if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification.permission === "granted"
      ) {
        next.forEach((item) => {
          if (seenIds.current.has(item._id)) return;

          seenIds.current.add(item._id);

          if (item.isRead) return;

          try {
            const popup = new window.Notification(item.title, {
              body: item.message,
              tag: item._id,
            });

            popup.onclick = () => {
              window.focus();
              if (item.link) navigate(item.link);
              popup.close();
            };
          } catch (error) {
            console.error("Browser notification could not be shown:", error);
          }
        });
      }

      next.forEach((item) => seenIds.current.add(item._id));
      setNotifications(next);
      setUnreadCount(response.data.unreadCount ?? 0);
    } catch (error) {
      console.error("Could not load notifications:", error);
    }
  }, [navigate]);

  useEffect(() => {
    loadNotifications();

    const timer = window.setInterval(loadNotifications, 30_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  async function markRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );

      setUnreadCount((count) =>
        Math.max(
          0,
          count - (notifications.find((item) => item._id === id)?.isRead ? 0 : 1)
        )
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not update notification."
      );
    }
  }

  async function openNotification(item) {
    if (!item.isRead) {
      await markRead(item._id);
    }

    setOpen(false);

    if (item.link?.startsWith("/")) {
      navigate(item.link);
    }
  }

  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not update notifications."
      );
    }
  }

  async function deleteNotification(id) {
    try {
      await api.delete(`/notifications/${id}`);
      const removed = notifications.find((item) => item._id === id);

      setNotifications((current) =>
        current.filter((item) => item._id !== id)
      );

      if (removed && !removed.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      toast.success("Notification removed.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not remove notification."
      );
    }
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications.");
      return;
    }

    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("Browser notifications enabled.");
        await loadNotifications();
      } else {
        toast.error("Browser notification permission was not granted.");
      }
    } catch {
      toast.error("Could not request notification permission.");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={async () => {
          const nextOpen = !open;
          setOpen(nextOpen);

          if (nextOpen) {
            setLoading(true);
            await loadNotifications();
            setLoading(false);
          }
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <section className="absolute right-0 z-50 mt-3 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <h2 className="font-bold text-slate-900">Notifications</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {unreadCount} unread
                </p>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    title="Mark all as read"
                    aria-label="Mark all as read"
                    className="rounded-lg p-2 text-teal-700 hover:bg-teal-50"
                  >
                    <CheckCheck size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {permission !== "granted" && permission !== "unsupported" && (
              <div className="border-b border-slate-100 bg-teal-50 p-3">
                <p className="text-xs leading-5 text-teal-900">
                  Enable browser notifications to receive alerts while
                  SehatSathi is open.
                </p>
                <button
                  type="button"
                  onClick={enableBrowserNotifications}
                  className="mt-2 text-sm font-semibold text-teal-800 underline"
                >
                  Enable notifications
                </button>
              </div>
            )}

            <div className="max-h-[min(65vh,480px)] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-8">
                  <LoaderCircle
                    size={24}
                    className="animate-spin text-teal-700"
                  />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellRing
                    size={30}
                    className="mx-auto mb-3 text-slate-300"
                  />
                  <p className="font-medium text-slate-700">
                    You're all caught up
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    New notifications will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon = getNotificationIcon(item.type);

                  return (
                    <article
                      key={item._id}
                      className={`flex gap-3 border-b border-slate-100 p-4 ${
                        item.isRead ? "bg-white" : "bg-teal-50/60"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 ring-1 ring-slate-200">
                        <Icon size={19} />
                      </div>

                      <button
                        type="button"
                        onClick={() => openNotification(item)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                          {item.message}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {formatNotificationDate(item.createdAt)}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteNotification(item._id)}
                        aria-label="Delete notification"
                        className="h-8 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}