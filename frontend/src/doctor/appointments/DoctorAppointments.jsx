import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";

const statuses = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

const badgeClasses = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);

      const params = {};

      if (status !== "all") params.status = status;
      if (selectedDate) params.date = selectedDate;

      const response = await api.get("/doctor/appointments", {
        params,
      });

      setAppointments(
        Array.isArray(response.data?.appointments)
          ? response.data.appointments
          : []
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  }, [status, selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const updateStatus = async (appointmentId, nextStatus) => {
    const confirmation =
      nextStatus === "cancelled"
        ? "Are you sure you want to cancel this appointment?"
        : `Change this appointment to ${nextStatus}?`;

    if (!window.confirm(confirmation)) return;

    try {
      setUpdatingId(appointmentId);

      const response = await api.patch(
        `/doctor/appointments/${appointmentId}/status`,
        { status: nextStatus }
      );

      const updated = response.data?.appointment;

      if (updated?._id) {
        setAppointments((current) =>
          current.map((item) =>
            item._id === appointmentId ? updated : item
          )
        );
      } else {
        // Reload if the API does not return the updated record.
        await loadAppointments();
      }

      toast.success(`Appointment ${nextStatus}.`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to update appointment."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const patientName = appointment.patient?.name || "";
    const email = appointment.patient?.email || "";
    const query = search.trim().toLowerCase();

    return (
      patientName.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700">
            DOCTOR WORKSPACE
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Appointments
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review and manage appointments assigned to you.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAppointments}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient name or email"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="relative">
            <Filter
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm capitalize outline-none focus:border-teal-500"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All statuses" : item}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <CalendarDays
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
              aria-label="Filter by appointment date"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">
              Appointment list
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredAppointments.length} record(s) displayed
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays
              size={36}
              className="mx-auto text-slate-300"
            />
            <h3 className="mt-3 font-semibold text-slate-800">
              No appointments found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing the status, date, or search terms.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((appointment) => {
              const currentStatus = appointment.status;
              const busy = updatingId === appointment._id;

              return (
                <article
                  key={appointment._id}
                  className="p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg font-bold text-teal-700">
                        {(appointment.patient?.name || "P")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          {appointment.patient?.name || "Patient"}
                        </h3>

                        <p className="mt-1 break-all text-sm text-slate-500">
                          {appointment.patient?.email ||
                            "Email unavailable"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays
                              size={15}
                              className="text-teal-600"
                            />
                            {formatDate(appointment.date)}
                          </span>

                          {appointment.time && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3
                                size={15}
                                className="text-teal-600"
                              />
                              {appointment.time}
                            </span>
                          )}
                        </div>

                        {appointment.reason && (
                          <p className="mt-2 text-sm text-slate-500">
                            Reason: {appointment.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          badgeClasses[currentStatus] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {currentStatus || "Unknown"}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        {currentStatus === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                updateStatus(
                                  appointment._id,
                                  "confirmed"
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                            >
                              <Check size={15} />
                              Confirm
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                updateStatus(
                                  appointment._id,
                                  "cancelled"
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            >
                              <X size={15} />
                              Cancel
                            </button>
                          </>
                        )}

                        {currentStatus === "confirmed" && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                updateStatus(
                                  appointment._id,
                                  "completed"
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Check size={15} />
                              Mark completed
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                updateStatus(
                                  appointment._id,
                                  "cancelled"
                                )
                              }
                              className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {busy && (
                          <span className="text-xs text-slate-500">
                            Updating...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}