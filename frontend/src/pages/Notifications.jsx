
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Search,
  RefreshCw,
  LoaderCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  Megaphone,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function getIcon(type) {
  switch (String(type || "").toLowerCase()) {
    case "warning":
    case "alert":
      return AlertTriangle;
    case "success":
      return CheckCircle2;
    case "announcement":
      return Megaphone;
    default:
      return Info;
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/notifications");

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.notifications)
          ? data.notifications
          : Array.isArray(data.data)
            ? data.data
            : [];

      setNotifications(list);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to load notifications.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter((item) => {
    const text = [
      item.title,
      item.message,
      item.description,
      item.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = text.includes(search.trim().toLowerCase());
    const isRead = Boolean(item.isRead ?? item.readAt);
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !isRead) ||
      (filter === "read" && isRead);

    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(
    (item) => !(item.isRead ?? item.readAt)
  ).length;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold tracking-wide text-teal-700">
            STAY INFORMED
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Notifications
          </h1>
          <p className="mt-2 text-slate-600">
            Get the latest health updates, service announcements, and alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl bg-teal-50 px-4 py-3 text-teal-800">
          <Bell size={20} />
          <span className="font-semibold">
            {unreadCount} unread
          </span>
        </div>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-3.5 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-teal-600"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter notifications"
          className="rounded-lg border border-slate-300 bg-white p-3"
        >
          <option value="all">All notifications</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        <button
          type="button"
          onClick={fetchNotifications}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      {loading ? (
        <div className="flex justify-center gap-2 py-12 text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading notifications...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="font-medium text-amber-900">{error}</p>
          <p className="mt-2 text-sm text-amber-800">
            Public notifications may require a separate backend endpoint.
          </p>
          <button
            type="button"
            onClick={fetchNotifications}
            className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"
          >
            Try again
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <Bell size={40} className="mx-auto text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-800">
            No notifications found
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Check back later for new announcements and updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const Icon = getIcon(item.type);
            const isRead = Boolean(item.isRead ?? item.readAt);

            return (
              <article
                key={item._id}
                className={`flex gap-4 rounded-xl border bg-white p-4 shadow-sm ${
                  isRead
                    ? "border-slate-200"
                    : "border-teal-200 bg-teal-50/30"
                }`}
              >
                <div className="h-fit rounded-xl bg-teal-50 p-3 text-teal-700">
                  <Icon size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">
                      {item.title || "Health Update"}
                    </h2>

                    {!isRead && (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {item.message || item.description || "No additional details."}
                  </p>

                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <CalendarDays size={14} />
                    {formatDate(item.createdAt || item.date)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
